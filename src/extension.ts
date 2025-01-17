import { glob } from "glob"
import path from "path"
import { getWorkspace } from "ultra-runner"
import {
  commands,
  ExtensionContext,
  QuickPickItem,
  Uri,
  window,
  workspace as vscodeWorkspace,
} from "vscode"

interface WorkspaceFolderItem extends QuickPickItem {
  root: Uri
  isRoot: boolean
  description: string
}

function getFolderEmoji(root: string, pkgRoot: string) {
  const config = vscodeWorkspace.getConfiguration("monolithium.folders")
  if (root == pkgRoot) return config.get<string>("prefix.root") || ""
  const dir = path.relative(root, pkgRoot)

  // Use custom prefixes first
  const custom = config.get<{ regex: string; prefix: string }[]>("custom")
  if (custom?.length) {
    for (const c of custom) {
      if (c.prefix && c.regex && new RegExp(c.regex, "u").test(dir))
        return c.prefix
    }
  }

  for (const type of ["apps", "libs", "tools"]) {
    const regex = config.get<string>(`regex.${type}`)
    const prefix = config.get<string>(`prefix.${type}`)
    if (regex && prefix && new RegExp(regex, "u").test(dir)) return prefix
  }
  return config.get<string>("prefix.unknown") || ""
}

async function getPackageFolders(
  includeRoot = true
): Promise<WorkspaceFolderItem[] | undefined> {
  const cwd = vscodeWorkspace.workspaceFolders?.[0].uri.fsPath
  if (cwd) {
    const workspace = await getWorkspace({
      cwd,
      includeRoot: true,
    })
    if (workspace) {
      const ret: WorkspaceFolderItem[] = []
      if (includeRoot)
        ret.push({
          label: `${getFolderEmoji(workspace.root, workspace.root)}${
            workspace.getPackageForRoot(workspace.root) || "root"
          }`,
          description: `${
            workspace.type[0].toUpperCase() + workspace.type.slice(1)
          } Workspace Root`,
          root: Uri.file(workspace.root),
          isRoot: true,
        })
      ret.push(
        ...workspace
          .getPackages()
          .filter((p) => p.root !== workspace.root)
          .map((p) => {
            return {
              label: `${getFolderEmoji(workspace.root, p.root)}${p.name}`,
              description: `at ${path.relative(workspace.root, p.root)}`,
              root: Uri.file(p.root),
              isRoot: false,
            }
          })
          .sort((a, b) => a.root.fsPath.localeCompare(b.root.fsPath))
      )
      return ret
    }
  }
}

enum PackageAction {
  newWindow,
  currentWindow,
}

/**
 * Attempts to find a .code-workspace file that is associated with {@link packageUri}.
 * .code-workspace files are expected to be located in the .vscode folder at the
 * top of the package
 * @param packageUri uri of an npm workspace (e.g., /path/to/packages/foo)
 * @returns path to vscode .code-workspace file associated with packageUri
 */
function getVscodeWorkspace(packageUri: Uri) {
  return new Promise((resolve, reject) => {
    void glob(
      `${packageUri.path}/.vscode/*.code-workspace`,
      (err, matches: string[]) => {
        if (err) {
          reject(err)
        }

        if (matches.length === 0) {
          resolve(false)
        }

        const vscodeWorkspace = Uri.file(matches[0])
        resolve(vscodeWorkspace)
      }
    )
  })
}

async function openPackage(action: PackageAction) {
  const items = await getPackageFolders()
  if (items) {
    const item = await window.showQuickPick(items, {
      canPickMany: false,
      matchOnDescription: true,
    })

    if (item) {
      const vscodeWorkspace = await getVscodeWorkspace(item.root)
      const uri = vscodeWorkspace || item.root

      switch (action) {
        case PackageAction.currentWindow:
          return commands.executeCommand("vscode.openFolder", uri)
        case PackageAction.newWindow:
          return commands.executeCommand("vscode.openFolder", uri, true)
      }
    }
  }
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("extension.openPackageCurrentWindow", () =>
      openPackage(PackageAction.currentWindow)
    ),
    commands.registerCommand("extension.openPackageNewWindow", () =>
      openPackage(PackageAction.newWindow)
    )
  )
}

// this method is called when your extension is deactivated
export function deactivate() {
  true
}
