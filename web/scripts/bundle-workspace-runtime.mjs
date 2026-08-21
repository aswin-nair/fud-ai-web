import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { resolveContractsPackage } from './verify-deploy-context.mjs'

export function contractsRuntimePackage(version = '0.1.0') {
  return {
    name: '@fud-ai/contracts',
    version,
    type: 'module',
    exports: { '.': './index.mjs' },
  }
}

export function resolveEsbuildRoot(webRoot) {
  const candidates = [
    join(webRoot, 'node_modules/esbuild'),
    join(webRoot, 'app/node_modules/esbuild'),
  ]
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'lib/main.js'))) return candidate
  }
  throw new Error('esbuild is not installed for the API runtime bundle')
}

export async function loadEsbuild(esbuildRoot) {
  return import(pathToFileURL(join(esbuildRoot, 'lib/main.js')).href)
}

export async function bundleContractsForNode({
  contractsRoot,
  destDir,
  esbuildRoot,
}) {
  const esbuild = await loadEsbuild(esbuildRoot)
  mkdirSync(destDir, { recursive: true })
  await esbuild.build({
    absWorkingDir: contractsRoot,
    entryPoints: [join(contractsRoot, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: join(destDir, 'index.mjs'),
    logLevel: 'silent',
  })
  const pkg = JSON.parse(readFileSync(join(contractsRoot, 'package.json'), 'utf8'))
  writeFileSync(
    join(destDir, 'package.json'),
    `${JSON.stringify(contractsRuntimePackage(pkg.version), null, 2)}\n`,
  )
}

export async function installContractsNodeRuntime(
  webRoot = dirname(dirname(fileURLToPath(import.meta.url))),
) {
  const { contractsRoot, version } = resolveContractsPackage(webRoot)
  const destDir = join(webRoot, 'node_modules/@fud-ai/contracts')
  const staging = join(webRoot, 'node_modules/.fud-ai-contracts-runtime')
  rmSync(staging, { recursive: true, force: true })
  await bundleContractsForNode({
    contractsRoot,
    destDir: staging,
    esbuildRoot: resolveEsbuildRoot(webRoot),
  })
  rmSync(destDir, { recursive: true, force: true })
  mkdirSync(dirname(destDir), { recursive: true })
  cpSync(staging, destDir, { recursive: true })
  rmSync(staging, { recursive: true, force: true })
  console.log(`Bundled @fud-ai/contracts@${version} for the Node API runtime`)
}
