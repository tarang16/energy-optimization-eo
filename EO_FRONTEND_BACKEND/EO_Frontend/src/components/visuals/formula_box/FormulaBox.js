import { FORMULA_BOX_VALIDATION, maxLengthInput } from 'config/Config'
import { all, create, parse } from 'mathjs'
import {
  setInvalid,
  setValid,
  updateDisplayValue,
} from 'pages/dashboard/pages/case_configuration_portal/ccp_tags/Field'
import { useEffect, useRef, useState } from 'react'
import { getFinalCalc, isValidString } from 'utills/utilities'
import styles from './FormulaBox.module.scss'
function parseCondition(i, expr, condition) {
  let openParens = 0
  while (i < expr.length) {
    if (expr[i] === ',' && openParens === 0) break
    if (expr[i] === '(') openParens++
    if (expr[i] === ')') openParens--
    condition += expr[i++]
  }
  return [i, expr, condition]
}
function parseTrueVal(i, expr, trueVal) {
  let openParens = 0
  while (i < expr.length) {
    if (expr[i] === ',' && openParens === 0) break
    if (expr[i] === '(') openParens++
    if (expr[i] === ')') openParens--
    trueVal += expr[i++]
  }
  return [i, expr, trueVal]
}
function parseFalseVal(i, expr, falseVal) {
  let openParens = 0
  while (i < expr.length) {
    if (expr[i] === '(') openParens++
    if (expr[i] === ')') openParens--
    falseVal += expr[i++]
  }
  return [i, expr, falseVal]
}
export function convertIfToTernary(expr) {
  expr = expr.trim()

  // Check for outer parentheses and remove them if present
  if (expr.startsWith('(') && expr.endsWith(')')) {
    const innerExpr = expr.slice(1, -1).trim()
    return `(${convertIfToTernary(innerExpr)})`
  }
  if (!expr.startsWith('if(')) {
    return expr
  }

  // Find the position of the closing parenthesis for the main `if` expression
  let closingParenIndex = expr.lastIndexOf(')')
  if (closingParenIndex === -1) {
    throw new Error('Invalid if expression format')
  }

  // Capture any remaining part of the expression after the main `if(...)`
  let remainingExpr = expr.slice(closingParenIndex + 1)

  // Process the main `if` expression (excluding the surrounding `if()` and trailing parts)
  expr = expr.slice(3, closingParenIndex)
  let condition = ''
  let trueVal = ''
  let falseVal = ''
  let i = 0
  ;[i, expr, condition] = parseCondition(i, expr, condition)
  i++
  ;[i, expr, trueVal] = parseTrueVal(i, expr, trueVal)
  i++
  falseVal = parseFalseVal(i, expr, falseVal)[2]

  // Recursively convert trueVal and falseVal
  trueVal = convertIfToTernary(trueVal.trim())
  falseVal = convertIfToTernary(falseVal.trim())

  // Include the remaining part of the expression in the final result
  return `(${condition.trim()}?${trueVal}:${falseVal})${remainingExpr}`
}
function splitExpression(expr) {
  const operators = new Set(['+', '-', '*', '/'])
  const result = []
  let current = ''
  for (const i in expr) {
    const char = expr[i]
    if (char === ' ') {
      continue // Skip whitespace
    }
    if (operators.has(char)) {
      if (current !== '') {
        result.push(current)
        current = ''
      }
      result.push(char)
    } else {
      current += char
    }
  }
  if (current !== '') {
    result.push(current)
  }
  return result
}
function transformExpression(input) {
  // Regular expression to match `missing(...)`
  const regex = /missing\(([^()]*)\)/g

  // Replace matches with quoted variables where necessary
  /* istanbul ignore next */
  const output = input.replace(regex, (match, args) => {
    if (!args.trim()) return match // Keep `missing()` as is

    // Split by operators if multiple arguments exist
    const transformedArgs = splitExpression(args)
      ?.map((arg) => {
        const trimmed = arg.trim()
        // Add quotes if the argument is a bare variable
        if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
          return `'${trimmed}'`
        }
        return arg // Return as is for numbers or expressions
      })
      .join('')
    return `missing(${transformedArgs})`
  })
  return output
}
export function validateFormula(formula, parser, maxLength) {
  if (!formula) {
    return {
      isValid: false,
      message: 'Invalid formula',
      value: formula,
      isRegexError: false,
    }
  }
  let replacedFormula = formula
    .replace(/parse\(%\{(\w+)\}\)/g, (match, p1) => p1)
    .replace(/\[(\w+)\]/g, '$1')
    .replaceAll('&&', '&')
    .replaceAll('||', '|')
    .replaceAll('rint', 'round')
    .replaceAll('avg', 'mean')
  let val = null
  try {
    if (formula) {
      const hasError = isValidString(formula, maxLength)
      if (hasError) {
        return {
          isValid: false,
          message: hasError,
          value: formula,
          isRegexError: true,
        }
      }
    }
    parse(replacedFormula)
    if (replacedFormula?.includes('missing(')) {
      replacedFormula = transformExpression(replacedFormula)
    }
    val = parser.evaluate(replacedFormula)
    return {
      isValid: true,
      message: 'formula is correct',
      value: val,
      isRegexError: false,
    }
  } catch (error) {
    if (error.message?.includes('Undefined symbol')) {
      return {
        isValid: true,
        message: error.message,
        value: val,
        isRegexError: false,
      }
    } else {
      return {
        isValid: false,
        message: error.message,
        value: null,
        isRegexError: false,
      }
    }
  }
}
export default function FormulaBox({
  onFormulaValidation = () => {},
  values_obj = {},
  id = 'input-box',
  classes = 'form-control text-12-regular',
  inValue = '',
  disabled = false,
  maxLength = maxLengthInput,
}) {
  const [parser, setParser] = useState(null)
  const [inputValue, setInputValue] = useState(inValue)
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeBracketIndex, setActiveBracketIndex] = useState(null)
  const [suggestionBoxPosition, setSuggestionBoxPosition] = useState('bottom')
  const [calcVal, setCalcVal] = useState('')
  const textAreaRef = useRef(null)
  useEffect(() => {
    if (parser && inValue !== inputValue) {
      setInputValue(inValue ?? '')
    }
  }, [inValue, parser])
  useEffect(() => {
    if (parser) {
      if (!inputValue) {
        setCalcVal('-')
        return setInvalid(textAreaRef?.current)
      }
      const { isValid, message, value, isRegexError } = validateFormula(
        inputValue,
        parser,
        maxLength,
      )
      const displayValue = updateDisplayValue(isRegexError, message, value)
      setCalcVal(displayValue)
      if (isRegexError && !isValid) {
        setInvalid(textAreaRef?.current)
      } else {
        isValid
          ? setValid(textAreaRef?.current)
          : setInvalid(textAreaRef?.current)
      }
    }
  }, [inputValue, parser])
  useEffect(() => {
    values_obj = {
      ...values_obj,
      ...FORMULA_BOX_VALIDATION,
    }
    const custom_functions = {
      missing: (variable) => {
        return !Object.keys(values_obj).includes(variable)
      },
      A: (a, b) => Math.pow(a, b),
      if: (condition, trueVal, falseVal) => (condition ? trueVal : falseVal),
    }
    const tempMath = create(all)
    tempMath.import(values_obj, {
      override: true,
    })
    tempMath.import(custom_functions, {
      override: true,
    })
    tempMath.import(
      {
        '^': (a, b) => Math.pow(a, b),
      },
      {
        override: true,
      },
    )
    tempMath.import(
      {
        if: (condition, trueVal, falseVal) => (condition ? trueVal : falseVal),
      },
      {
        override: true,
      },
    )
    const parserInstance = tempMath.parser()
    if (!parser) setParser(parserInstance)
    return () => {
      parserInstance.clear()
    }
  }, [parser, values_obj])
  const handleChange = (e) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart
    setInputValue(value ?? '')
    const textBeforeCursor = value.substring(0, cursorPosition)
    const openBracketIndex = textBeforeCursor.lastIndexOf('[')
    const closeBracketIndex = textBeforeCursor.lastIndexOf(']')
    if (openBracketIndex !== -1 && openBracketIndex > closeBracketIndex) {
      const textAfterBracket = textBeforeCursor.substring(openBracketIndex + 1)
      const nextCloseBracketIndex = textAfterBracket.indexOf(']')
      const query =
        nextCloseBracketIndex === -1
          ? textAfterBracket
          : textAfterBracket.substring(0, nextCloseBracketIndex)
      const filtered = Object.keys(values_obj).filter((suggestion) =>
        suggestion.toLowerCase().startsWith(query.toLowerCase()),
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
      setActiveBracketIndex(openBracketIndex + 1)

      // Determine position based on space
      const textareaRect = textAreaRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - textareaRect.bottom
      const spaceAbove = textareaRect.top
      if (spaceBelow < 150 && spaceAbove > 150) {
        setSuggestionBoxPosition('top')
      } else {
        setSuggestionBoxPosition('bottom')
      }
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
      setActiveBracketIndex(null)
    }
  }
  const handleSuggestionClick = (suggestion) => {
    if (activeBracketIndex === null) return
    const valueBeforeBracket = inputValue.substring(0, activeBracketIndex)
    const remainingValue = inputValue.substring(activeBracketIndex)
    const closingBracketIndex = remainingValue.indexOf(']')
    const valueAfterBracket =
      closingBracketIndex !== -1
        ? remainingValue.substring(closingBracketIndex + 1)
        : ''
    const isClosingBracketNeeded = closingBracketIndex === -1
    const newValue = isClosingBracketNeeded
      ? valueBeforeBracket + suggestion + ']' + valueAfterBracket
      : valueBeforeBracket +
        suggestion +
        remainingValue.substring(closingBracketIndex)
    setInputValue(newValue ?? '')
    setShowSuggestions(false)
    setActiveBracketIndex(null)
    const resp = validateFormula(newValue, parser)
    onFormulaValidation(resp)
  }
  return (
    <div
      className={`position-relative formulaBoxGlobalContainer ${styles.formulaBoxContainer} ${styles.formulaBoxContainerSpan}`}
      data-static-id='FormulaBox.js_div_bc1df1'
    >
      <textarea
        ref={textAreaRef} // ref for textarea
        type='text'
        value={inputValue}
        data-testid='formula-box-input'
        id={id}
        data-valid={validateFormula(inputValue, parser)?.isValid ? true : false}
        placeholder='Enter your formula here'
        className={`${classes} pe-4 py-2`}
        disabled={disabled}
        onChange={(e) => {
          const resp = validateFormula(e.target.value, parser)
          onFormulaValidation(resp, e.target.value)
          handleChange(e)
        }}
        style={{
          height: '4vmin',
          width: '100%',
        }}
        data-static-id='FormulaBox.js_textarea_09864c'
      />
      <div
        className={`form-text text-11-bold mt-1 text-uppercase text_primary_gray_2`}
        data-static-id='FormulaBox.js_div_2300a7'
      >
        CALC VAL : {getFinalCalc(calcVal, values_obj)}
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul
          className={`${styles.suggestion_list} ${suggestionBoxPosition}`} // dynamic class for position
          data-static-id='FormulaBox.js_ul_703d44'
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`${styles.suggestion_item} text-14-regular`}
              data-static-id='FormulaBox.js_li_f975a7'
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
