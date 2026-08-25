# mewa_ui consumers

Nine services consume this library. Each repository is the source of truth for its own application code; this library is the source of truth for the shared interface system. Deployment compose files live under `/home/core/docker/<name>/`.

## Consumption modes

| Service | Repository | Mode | Update path |
| --- | --- | --- | --- |
| hf_ui | `/repo/hf_ui` | Live bind mount `/repo/ui_library:/ui:ro` | Library edits reach the running container immediately. |
| media_ui | `/repo/media_ui` | Live bind mount `/repo/ui_library:/ui:ro` | Library edits reach the running container immediately. |
| memes_ui | `/repo/memes_ui` | Live bind mount `/repo/ui_library:/ui:ro` | Library edits reach the running container immediately. |
| moonlight_ui | `/repo/moonlight_ui` | Live bind mount `/repo/ui_library:/ui:ro` | Library edits reach the running container immediately. |
| homelab_ui | `/repo/homelab_ui` | Live bind mount `/repo/ui_library:/ui:ro` | Library edits reach the running container immediately. |
| rss | `/repo/rss` | Vendored subset `assets/ui` via `assets/sync-ui.sh` | Run `assets/sync-ui.sh`, then rebuild the image. |
| dufs | `/repo/dufs` | Vendored `ui/` via `sync-ui.sh`, bind-mounted read-only into the container | Run `./sync-ui.sh`, then restart the container: dufs 0.46 reads its assets package once at startup, so running containers do not pick up synced files. |
| uncanny_lab | `/repo/uncanny_lab` | Vendored `web/static/ui`, embedded with `go:embed` | Sync the vendored set, then rebuild the image (the binary embeds the assets). |
| mewa_bookmarks | `/repo/mewa_bookmarks` | Vendored subset `internal/web/static/ui`, embedded with `go:embed`, pinned in `VENDORED.md` | Sync the vendored set, update the pinned commit in `VENDORED.md`, then rebuild the image. |

## Vendored-commit bump procedure

1. Land and commit the library change in this repository first.
2. Run the consumer's sync script against this repository (`sync-ui.sh` defaults to `/repo/ui_library`).
3. For `mewa_bookmarks`, update the source commit line in `internal/web/static/ui/VENDORED.md` to the new library commit.
4. Re-run the consumer's tests (`go test ./...`, plus Node checks where the repo has them).
5. Rebuild and redeploy the container when the mode requires it, then verify the served pages.
6. Commit the vendored refresh in the consumer repository separately from application changes.

## Contact points

- Compose files: `/home/core/docker/<name>/docker-compose.yaml`. `uncanny_lab` builds from `/repo/uncanny_lab` with the revision passed as a build arg; the other consumers either pull images or build from their repositories.
- Live-mount consumers must keep the library additive-first: a breaking library change is visible in five running services the moment it is written to `/repo/ui_library`.
- The doc site under `docs/` is a documentation convenience, not the consumer include pattern. Consumers load only the assets for the components they use.
