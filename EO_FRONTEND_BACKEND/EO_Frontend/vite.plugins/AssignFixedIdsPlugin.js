import generate from '@babel/generator'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import crypto from 'crypto'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export function AssignFixedIdsPlugin(env) {
    if (env.EO_GENERATE_TUT_ID !== 'true') {
        return
    }
    const projectDir = path.resolve(__dirname, '../src')
    function hash(str) {
        return crypto.createHash('md5').update(str).digest('hex').slice(0, 6)
    }
    function processFile(filePath) {
        const code = fs.readFileSync(filePath, 'utf-8')
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        })
        const fileName = path.basename(filePath).replace(/\.(tsx|jsx)$/, '')
        traverse.default(ast, {
            JSXOpeningElement(pathNode) {
                const name = pathNode.node.name
                if (!t.isJSXIdentifier(name)) return
                const tagName = name.name
                // -------------------------
                // 🚫 1. Skip React root wrappers (StrictMode, App, createRoot rendered components)
                // -------------------------
                const ROOT_WRAPPERS = new Set(['StrictMode', 'App', 'NewApp', 'Root'])
                if (ROOT_WRAPPERS.has(tagName)) {
                    return
                }
                // -------------------------
                // ⭐ 2. Allowed uppercase components (force id)
                // -------------------------
                const FORCE_ADD_COMPONENTS = new Set([
                    'Popover',
                    'Snackbar',
                    'Alert',
                    'Slide',
                    'InputAdornment',
                    'TextField',
                    'FormControlLabel',
                    'Typography',
                    'Radio',
                    'RadioGroup',
                    'Checkbox',
                    'Chip',
                    'Box',
                    'Paper',
                    'ListItemText',
                    'ListItemIcon',
                    'ListItem',
                    'Tooltip',
                    'Table',
                    'TableHead',
                    'TableBody',
                    'TableRow',
                    'TableCell',
                    'TableContainer',
                    'Tab',
                    'IconButton',
                    'Select',
                    'MenuItem',
                    'Tabs',
                    'NavLink',
                    'Link',
                    'Button',
                    'Breadcrumb',
                ])
                const isCustomComponent = /^[A-Z]/.test(tagName)
                // 🚫 Skip custom components unless they are in the force-add list
                if (isCustomComponent && !FORCE_ADD_COMPONENTS.has(tagName)) {
                    return
                }
                // -------------------------
                // 🚫 3. Skip if has existing data-static-id
                // -------------------------
                const hasDataTut = pathNode.node.attributes.some(
                    (attr) =>
                        t.isJSXAttribute(attr) &&
                        t.isJSXIdentifier(attr.name) &&
                        attr.name.name === 'data-static-id',
                )
                if (hasDataTut) return
                // -------------------------
                // 🔐 4. Generate stable key
                // -------------------------
                const positionKey = `${filePath}:${pathNode.node.loc?.start.line}:${pathNode.node.loc?.start.column}`
                const hashId = hash(positionKey)
                const finalId = `${fileName}_${tagName}_${hashId}`
                // -------------------------
                // ✅ 5. Add attribute
                // -------------------------
                pathNode.node.attributes.push(
                    t.jsxAttribute(t.jsxIdentifier('data-static-id'), t.stringLiteral(finalId)),
                )
            },
        })
        const output = generate.default(ast, {}, code).code
        fs.writeFileSync(filePath, output, 'utf-8')
    }
    function walk(dir) {
        fs.readdirSync(dir).forEach((file) => {
            const fullPath = path.join(dir, file)
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath)
            } else {
                // Skip test files
                if (
                    fullPath.endsWith('.test.tsx') ||
                    fullPath.endsWith('.test.jsx') ||
                    fullPath.endsWith('.test.js') ||
                    fullPath.endsWith('.spec.js')
                ) {
                    return
                }
                if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
                    processFile(fullPath)
                }
            }
        })
    }
    return {
        name: 'vite-plugin-assign-fixed-ids',
        buildStart() {
            walk(projectDir)
            console.log('✅ Stable semantic IDs assigned to JSX elements.')
        },
    }
}
