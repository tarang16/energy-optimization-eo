import { useEffect } from 'react'
import { getValsBaseOnCondition } from 'utills/utilities'
const compressDomPath = (input) => {
  const [prefix, rest] = input.split('__')
  const parts = rest.split('-')
  let compressed = ''
  for (const part of parts) {
    const openBracketIndex = part.indexOf('[')
    const tag = part.slice(0, openBracketIndex)
    const index = part.slice(openBracketIndex + 1, part.length - 1) // remove brackets
    compressed += tag[0] + index
  }
  const attr = document.body.getAttribute('data-pagename')
  if (!attr) return ''
  const base = getValsBaseOnCondition(attr, `${attr}__`, '')
  return `${prefix}__${base}${compressed}`
}
const isValidElement = (el) => {
  return el instanceof HTMLElement || el instanceof SVGElement
}
const getDomPath = (el) => {
  const path = []
  while (el?.parentElement) {
    const tag = el.tagName.toLowerCase()
    const siblings = Array.from(el.parentElement.children).filter(
      (sibling) => sibling.tagName === el.tagName,
    )
    const index = siblings.indexOf(el)
    path.unshift(`${tag}[${index}]`)
    el = el.parentElement
  }
  return `reactour__${path.join('-')}`
}
const injectIDs = () => {
  const allElements = document.body.querySelectorAll('*')
  allElements.forEach((el) => {
    if (isValidElement(el)) {
      const domPath = getDomPath(el)
      const compressedPath = compressDomPath(domPath)
      if (compressedPath) {
        el.setAttribute('data-tut', compressedPath)
      } else {
        el.removeAttribute('data-tut')
      }
    }
  })
}
const DomIDInjectorWrapper = ({ children }) => {
  useEffect(() => {
    // Initial injection
    injectIDs()

    // Set up MutationObserver
    const observer = new MutationObserver(() => {
      injectIDs() // Re-run injection when DOM changes
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    })
    return () => {
      observer.disconnect() // Cleanup on unmount
    }
  }, [])
  return <>{children}</>
}
export default DomIDInjectorWrapper
