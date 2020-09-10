---
authors: Alexander Klizhentas (sasha@gravitational.com), Ben Arent (ben@gravitational.com)
state: discussion
---

# RFD 3 - Extended approval workflows

## What

Extended approval workflows is a set of additions to existing
Workflows API with new controls for granting limited access to infrastructure
on demand.

## Why

Customers provide limited access to the infrastructure
for contractors are lacking support for their scenarios.

This document describes the scenarios and introduces design changes
to support them.

**Automatic approval for contractors**

Imagine two organizations, Acme Co and Contractor Inc.

Acme Co serves multiple customers `A` and `B` via leaf clusters `a` and `b`
connected to it's root cluster `acme`.

Acme Co creates a support issue `issue-1` for customer `A` and assigns it to
Contractor Inc's employee Alice. Acme would like to provide temporary access
for Alice until the ticket is closed.

Alice should only see the cluster and nodes she has been granted access to
and nothing else.

**Access based on the ticket number**

Due to regulations fin-tech companies grant access only if
the user has provided a valid ticket number at login time. The granted role
is determined by the plugin based on the username, SSO information and
the ticket number.

However, if the ticketing system is down, requests to login should be
manually processed by the cluster administrator to provide
emergency way to access the infrastructure.

**Access to nodes**

Company Pine Tree Inc, serves thousands of customers.
Administrators of the company would like to let contractors see all nodes in the cluster,
but have access to no nodes by default.

Contractors of 'Pine Tree Inc' would have to request access to individual nodes
and the access would have to be granted/denied by administrators in slack channel.

### Details

Let's add missing features to Teleport and use them to compose a solution
for scenarios described in "Why" section.

#### Dynamic role requests

We are going to modify `request` part of the roles to support pattern matching.

```yaml
kind: role
metadata:
  name: contractor
spec:
  options:
    # ...
  allow:
    request:
      roles: ['^customer-.*$']
    # ...
  deny:
    # ...
```

#### Cluster access labels

Clusters labels, similarly to `node_labels`,
limit the access to clusters from the root cluster.

```yaml
kind: role
metadata:
  name: customer-a
spec:
  options:
    # ...
  allow:
    cluster_labels:
      customer: 'customer-a'
    # ...
  deny:
    # ...
```

To preserve backwards compatibility, if not specified, `cluster_labels` default
value is: `'*':'*'`, granting visibility and access to all clusters.

#### Access request metadata

Access request gets additional fields to specify information about requests
to individual resources:

```yaml
kind: access_request
metadata:
  name: request-id
spec:
  note: 'ticket-12345`
  user: 'bob'
  # Role list can be empty, in case if Bob tries to access a resource
  # and not a specific role
  roles: []
  # Bob has requested access to the mongodb as root
  resources:
  - kind: node
    name: mongodb
    verb: connect
    principal: root
```

Admins will get a new CLI and API to approve requests and modify roles:

```bash
# Bob wants to ssh into mongodb as root
$ tctl request ls
Token             Requestor Metadata             Note         Created At (UTC)    Status
----------------- --------- -------------------- ------------ -------------- -------
request-id-1      bob       ssh root@mongodb     ticket-1234  07 Nov 19 19:38 UTC PENDING

# craft a role granting access just to this node
$ tctl role create custom.yaml

# approve access request and assign the custom role
$ tctl request approve request-id --roles=custom
```

#### User interface flows

Imagine Bob has the following default role:

```yaml
kind: role
metadata:
  name: contractor
spec:
  allow:
    request:
      roles: ['^customer-.*$']
```

Users will have several options:

**Option 0: Requesting access during the login in the UI or the CLI**

Teleport login screen will have a separate optional field: "Request access". Alice
clicks "Request access" expandable section and adds a note with a ticket number.

Once Alice enters a reason, Teleport will create an `access_request` with note
provided by her in case if login is successful. The user interface shows
a screen "Requesting access, please wait" as a separate state after the login
and redirects back to the UI or tsh.

**Option 1: Requesting access after login in the UI**

Once in the system, Bob clicks on the top right nav corner and
fills in fields request access dialog window:

* Selects a role from the list
* Optionally adds a note - ticket-1234

He then waits for the request to be granted or denied. The user interface shows
a screen "Requesting access, please wait" as a separate message in the user interface.

**Option 2: Requesting access through the node list in the UI**

Alice goes to the nodes list, selects a node and clicks on the drop down action
'request access':

* Selects or enters new SSH principal
* Optionally adds a note - ticket-1234

She then waits for the request to be granted or denied.

**Approved**

In both cases, Bob waits until the request gets approved, and in the case
if it does, Bob sees a notification, UI gets reloaded and Bob gets access
to the node/or sees the new list of nodes.

### Examples

#### Automatic approval for contractors

Let's go back the the example of 'Acme Co' and craft a plugin design that will
approve the request to cluster whenever there is a ticket assigned to a user.

**Roles**

On the root cluster `acme`, let's define the default role all contractors are
assigned to by default:

```yaml
kind: role
metadata:
  name: contractor
spec:
  allow:
    request:
      roles: ['^customer-.*$']
```

This role assigned to all contractors by default lets users to request access to customer related roles.

Second role `customer-a` lets clients to see leaf cluster `customer-a` and access it:

```yaml
kind: role
metadata:
  name: customer-a
spec:
  options:
    # limit max session TTL to 1 hour and disconnect the connection
    # when the certificate expires
    max_session_ttl: 1h
    disconnect_expired_cert: yes
  allow:
    cluster_labels:
      customer: 'customer-a'
```

Contractors are not assigned to this role, but can request access to it.

Leaf clusters are autonomous and have their own set of roles. Leaf cluster `a`
will define local role:

```yaml
kind: role
metadata:
  name: remote-contractor
spec:
  options:
    # limit access to a separate SSH principal
    logins: [contractor]
  allow:
    node_labels:
      # limit access to some nodes
      'access': 'contractor'
```

Trusted cluster spec will map `customer-a` role to `remote-contractor` role:

```
kind: trusted_cluster
metadata:
  name: "acme"
spec:
  enabled: true
  role_map:
    - remote: customer-a
      local: [remote-contractor]
```

**User experience**

Contractors will log in and enter the ticket number, Teleport will generate access request on their behalf
because of the `always_request_access` role option, and if granted by plugin
based on the ticket number, they will see the clusters to access.
