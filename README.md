# Monorepo Workspace

Quickly navigate monorepos with multi-root workspaces. Supports npm, turborepo, lerna, yarn, pnpm, rushjs, and .code-workspace files

## Features

All **Monolithium** functionality can be found in the command palette. Available commands:

![Commands](images/animation.gif)

- `Monolithium: Open Package (Current Window)`: open a package from your repository in the current window
- `Monolithium: Open Package (New Window)`: open a package from your repository in a new window

## Vscode Workspaces

Vscode workspaces (.code-workspace) are a useful feature in monorepos. They are especially useful if you need to apply different settings for different packages via `settings.json`. We recommend creating at least one .code-workspace file at the root of your repo to support this workflow:

```
.vscode
  root.code-workspace
  settings.json
packages
  package1
    .vscode
      settings.json
apps
  app1
    .vscode
      settings.json
package.json
```

with the following settings:

```
{
  "folders": [
    {
      "name": "root",
      "path": ".."
    },
    {
      "name": "app1",
      "path": "../apps/app1"
    },
    {
      "name": "package1",
      "path": "../packages/package1"
    },
    ...
  ]
}
```

Doing so will preserve the functionality of package specific `settings.json` files _when working from the root_ (otherwise only root's settings will be used)

Note that while .code-workspace files will be opened (if available), they are not the source of truth for your monorepo structure. The `workspaces` setting in package.json is the source of truth

## Extension Settings

**Monorepo Manager** tries to detect the type of package (library, application or tool) based on configurable regexes.

The workspace folder prefix containing the emoji is also configurable.

You can also configure custom types with a prefix in your JSON settings:

```json
{
  "monolithium.folders.custom": [
    { "regex": "app1", "prefix": "🔥" },
    { "regex": "app2", "prefix": "📚" }
  ]
}
```

You can find all options under "Monolithium" in your configurtion.
