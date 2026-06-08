import { convertIfToTernary } from 'components/visuals/formula_box/FormulaBox'
import { all, create, parse } from 'mathjs'
import { useEffect, useState } from 'react'
function validateFormula(formula, parser) {
  let replacedFormula = ''
  // replace parse(%{abc}) to abc
  replacedFormula = formula?.replace(/parse\(%\{(\w+)\}\)/g, (match, p1) => p1)

  // replace [abc] to abc
  replacedFormula = replacedFormula?.replace(/\[(\w+)\]/g, '$1')
  replacedFormula = replacedFormula
    ?.replaceAll('&&', '&')
    ?.replaceAll('||', '|')
    ?.replaceAll('rint', 'round')
    ?.replaceAll('avg', 'mean')
  let val = null
  try {
    parse(replacedFormula)
    if (replacedFormula?.includes('if')) {
      const ternaryFormula = convertIfToTernary(replacedFormula)
      val = parser.evaluate(ternaryFormula)
    } else {
      val = parser.evaluate(replacedFormula)
    }
    return {
      isValid: true,
      message: 'formula is correct: ' + val,
    }
  } catch (error) {
    return {
      isValid: false,
      message: error.message,
    }
  }
}
export default function FormulaValidation() {
  const [inputFormula, setInputFormula] = useState('')
  const [validation, setValidation] = useState({
    isValid: true,
    message: '',
  })
  const [math, setMath] = useState(null)
  const [parser, setParser] = useState(null)
  useEffect(() => {
    if (!math) {
      const tempMath = create(all)
      tempMath.import({
        tag1: 42,
        tag2: 43,
        abc: 12,
        Wash_tower_overhead_temp: 10,
        Lean_cycle_gas_pressure: 20,
        CC_factor_reactor_A: 10,
        CC_factor_reactor_B: 30,
        match_tag_propane_content_in_product_draw_current_value: 0.1,
        match_tag_mass_balance_propylene_frac_current_value: 1,
      })
      setMath(tempMath)
      const parser = tempMath.parser()
      setParser(parser)
    }
  }, [])
  useEffect(() => {
    if (inputFormula) {
      const resp = validateFormula(inputFormula, parser)
      setValidation(resp)
    }
  }, [inputFormula])
  return (
    <>
      <input
        type='text'
        id='formulaInput'
        placeholder='Enter your formula here'
        value={inputFormula}
        onChange={(e) => setInputFormula(e.target.value)}
        style={{
          height: '50px',
          width: '100%',
          fontSize: '1.2em',
        }}
        data-static-id='FormulaValidation.js_input_aa8375'
      />
      <div
        id='errorMessage'
        style={{
          color: validation?.isValid ? 'green' : 'red',
          fontSize: '1em',
        }}
        data-static-id='FormulaValidation.js_div_e24952'
      >
        {validation?.message}
      </div>
    </>
  )
}
