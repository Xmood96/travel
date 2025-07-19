# 🧹 Cleanup Script - Unused Files

## Files to Delete (Safe to Remove)

### 1. Completely Unused Components

```bash
# Remove these files - they are not imported anywhere
rm src/ModernApp.tsx
rm src/components/ui/modern/Card.tsx
rm src/components/ui/modern/Input.tsx
rm src/components/ui/modern/Layout.tsx
rm src/components/ui/modern/Modal.tsx
rm src/componets/ui/FloatingActionButton.tsx
rm src/componets/ui/ErrorRecoveryStatus.tsx
rm src/componets/ui/card.tsx
rm src/componets/ui/input.tsx
rm src/componets/ui/modal.tsx
rm src/componets/ui/select.tsx
rm src/componets/ui/utils.ts
```

### 2. Duplicate/Redundant Files

```bash
# Keep the enhanced version, remove the simple one
rm src/components/LoadingSpinner.tsx
# Keep: src/componets/ui/LoadingSpinner.tsx

# Choose one BottomNav implementation
# Current: both are used by different dashboards
# TODO: Consolidate into one component
```

### 3. Unused API Files

```bash
# This file exports functions but they're never imported
rm src/api/offlineHandler.ts
```

### 4. Potential Duplicates to Review

```bash
# These might be duplicates - need manual review:
# src/componets/ui/botom.tsx vs src/componets/ui/BottomNav.tsx
# src/componets/ui/bonavp.tsx (BottomNav2) vs BottomNav.tsx
```

## Files to Keep (Actively Used)

### Core App Files ✅

- `src/App.tsx` (main app entry)
- `src/main.tsx` (Vite entry point)
- All files in `src/context/`, `src/types/`

### API Services ✅ (All Used)

- `currencyService.ts`, `useCurrency.ts`
- `authService.ts`, `agentService.ts`
- `serviceService.ts`, `useAppData.ts`
- `loggingService.ts`, `firebaseErrorHandler.ts`
- `ticketbuid.ts`, `getusers.ts`

### Active Components ✅

- All files in `src/componets/Admin/`, `src/componets/Agent/`, `src/componets/Logs/`
- Core: `Login.tsx`, `Chat.tsx`, `AgentDashboard.tsx`, `Profile.tsx`
- UI: `BottomNav.tsx`, `bonavp.tsx`, `NetworkStatus.tsx`, `ResponsiveGrid.tsx`

### Modern Components ✅ (Some Used)

- `src/components/Admin/ModernAdminDashboard.tsx`
- `src/components/ui/modern/Button.tsx` (IconButton is used)

## Cleanup Impact

### Bundle Size Reduction

- **Estimated savings**: 50-100KB minified
- **Unused components**: ~15-20 files
- **Dead code elimination**: Improved tree-shaking

### Maintenance Benefits

- Cleaner codebase
- Faster builds
- Less confusion for developers
- Better IDE performance

## Manual Review Needed

### 1. BottomNav Components

Currently there are multiple BottomNav implementations:

- `src/componets/ui/BottomNav.tsx` - Used by AdminDashboard
- `src/componets/ui/bonavp.tsx` - Used by AgentDashboard (called BottomNav2)
- `src/componets/ui/botom.tsx` - Potential duplicate

**Recommendation**: Consolidate into one flexible component

### 2. Modern UI Components

The `src/components/ui/modern/` directory has components that might be part of a design system:

- Some are used (Button.tsx)
- Others are unused (Card.tsx, Input.tsx, etc.)

**Recommendation**: Either integrate fully or remove unused ones

### 3. Directory Structure

The `src/componets/` vs `src/components/` naming inconsistency should be resolved.

## Cleanup Commands

```bash
# Run these commands to clean up (BACKUP FIRST!)

# 1. Remove confirmed unused files
rm src/ModernApp.tsx
rm src/components/ui/modern/Card.tsx
rm src/components/ui/modern/Input.tsx
rm src/components/ui/modern/Layout.tsx
rm src/components/ui/modern/Modal.tsx
rm src/componets/ui/FloatingActionButton.tsx
rm src/componets/ui/ErrorRecoveryStatus.tsx
rm src/componets/ui/card.tsx
rm src/componets/ui/input.tsx
rm src/componets/ui/modal.tsx
rm src/componets/ui/select.tsx
rm src/componets/ui/utils.ts
rm src/api/offlineHandler.ts
rm src/components/LoadingSpinner.tsx

# 2. Update imports if needed (check for broken imports after deletion)
# 3. Run build to ensure nothing is broken
npm run build

# 4. Test the application thoroughly
```

## Post-Cleanup Testing

After cleanup, test these critical paths:

1. ✅ Login flow
2. ✅ Admin dashboard navigation
3. ✅ Agent dashboard navigation
4. ✅ Ticket creation and management
5. ✅ Service ticket creation and management
6. ✅ User management
7. ✅ Settings and logs

## Notes

- Always backup before mass deletion
- Run `npm run build` after cleanup to catch broken imports
- Test all major functionality after cleanup
- Consider using a tool like `unimported` to find unused files automatically
