import styled from 'styled-components'
import PropTypes from 'prop-types'
import defaultTheme from './../theme'
import { space, propTypes } from 'styled-system'

const borders = ({ color, theme }) => {
  const borderColor = color ? theme.colors[color] : theme.colors.borderGray
  const focusColor = color ? borderColor : theme.colors.blue
  return {
    'border-color': borderColor,
    'box-shadow': `0 0 0 1px ${borderColor}`,
    ':focus': {
      outline: 0,
      'border-color': focusColor,
      'box-shadow': `0 0 0 2px ${focusColor}`
    }
  }
}

const Input = styled.input`
  appearance: none;
  border-radius: 4px;
  background: ${props => props.hasError ? props.theme.background.error : '#FFF' };
  border: ${props => props.hasError ? `2px solid ${props.theme.colors.warning}` : 'none' };
  box-sizing: border-box;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, .24);
  color: ${ props => props.theme.text};
  font-family: inherit;
  font-size: 16px;
  display: block;
  height: 40px;
  line-height: 40px;
  margin: 0;
  outline: none;
  padding: 0 16px;
  width: 100%;

  ::-ms-clear {
    display: none;
  }

  ::placeholder {
    color: ${props => props.theme.colors.subtle};
  }

  ${space};
`

Input.displayName = 'Input'

Input.propTypes = {
}



export default Input