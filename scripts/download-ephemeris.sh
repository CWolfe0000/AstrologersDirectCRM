#!/usr/bin/env bash
# Same pinned Astrodienst commit and checksums as Sky (validation/download-official-ephemeris.sh).
set -euo pipefail
: "${SWEPH_EPHE_PATH:=$(pwd)/.sweph-ephe}"
case "$SWEPH_EPHE_PATH" in /*) ;; *) echo "SWEPH_EPHE_PATH must be absolute" >&2; exit 1;; esac
mkdir -p "$SWEPH_EPHE_PATH"
UPSTREAM=c69c14adb7a0f94829586ffd92cd422aacb21e86
for spec in \
 'sepl_18.se1 484061 786702cd04506371ee6223af1ebac02d54c848b8 ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66' \
 'semo_18.se1 1304771 5427d9f885fd6cb9489584ade37e52c6abb4d407 1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7' \
 'seas_18.se1 223004 8f900cab7e557e4c41f758a6bf3a3c3967e7e3db a2cd8fc33807c78ca9a700c91c2e042258b12fc4796519e00781440b5ad8b2e2'
do
 read -r NAME SIZE BLOB_SHA SHA256 <<< "$spec"
 curl --fail --location --retry 3 --silent --show-error \
   "https://raw.githubusercontent.com/aloistr/swisseph/$UPSTREAM/ephe/$NAME" \
   --output "$SWEPH_EPHE_PATH/$NAME"
 test "$(stat -c %s "$SWEPH_EPHE_PATH/$NAME")" = "$SIZE"
 test "$(git hash-object "$SWEPH_EPHE_PATH/$NAME")" = "$BLOB_SHA"
 echo "$SHA256  $SWEPH_EPHE_PATH/$NAME" | sha256sum --check
done
echo "EPHE path: $(realpath "$SWEPH_EPHE_PATH")"
ls -lah "$SWEPH_EPHE_PATH"
