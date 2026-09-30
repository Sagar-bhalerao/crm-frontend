#!/bin/sh
# Run once from the crm-frontend folder, AFTER copying in the new files.
# Removes the old editable settings and points their three remaining users
# at the fixed defaults in src/config/app.js. Works on macOS and Linux.
set -e

# InvoiceDialog and QuotationEditor read `settings.*`; keep that name, change the source.
for f in src/components/leads/InvoiceDialog.jsx src/components/leads/QuotationEditor.jsx; do
  perl -0pi -e 's|import \{ useSettings \} from "\@/context/SettingsContext";|import { APP_DEFAULTS } from "\@/config/app";|; s|const \{ settings \} = useSettings\(\);|const settings = APP_DEFAULTS;|' "$f"
  echo "updated $f"
done

# The dashboard read settings through the plain module.
perl -0pi -e 's|import \{ getRuntimeSettings \} from "\./runtimeSettings";|import { APP_DEFAULTS } from "\@/config/app";|; s|getRuntimeSettings\(\)|APP_DEFAULTS|g' src/lib/dashboard.js
echo "updated src/lib/dashboard.js"

rm -f src/context/SettingsContext.jsx src/lib/runtimeSettings.js src/services/admin/settingsService.js
echo "deleted SettingsContext.jsx, runtimeSettings.js, settingsService.js"

echo
echo "Anything below still refers to the old settings and needs a look:"
grep -rn "useSettings\|SettingsContext\|SettingsProvider\|runtimeSettings\|RuntimeSettings\|settingsService" src || echo "  nothing, all clear"
