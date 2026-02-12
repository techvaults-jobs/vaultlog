#!/bin/bash

# Setup Git hooks for pre-push validation

HOOK_DIR=".git/hooks"
PRE_PUSH_HOOK="$HOOK_DIR/pre-push"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOK_DIR"

# Create pre-push hook
cat > "$PRE_PUSH_HOOK" << 'EOF'
#!/bin/bash

# Pre-push hook - runs validation before pushing to GitHub
bash scripts/pre-push-check.sh
EOF

# Make hook executable
chmod +x "$PRE_PUSH_HOOK"

echo "✅ Git hooks installed successfully!"
echo "📌 Pre-push hook will run: npm run lint, tsc --noEmit, and npm run build"
