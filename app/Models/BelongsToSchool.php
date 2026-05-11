<?php

namespace App\Models\Concerns;

use App\Models\School;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

/**
 * Trait BelongsToSchool
 *
 * Enforces strict tenant isolation at the ORM layer.
 * Every model using this trait is ALWAYS scoped to the
 * authenticated user's school_id. Super admins bypass this.
 *
 * CRITICAL: This is the PRIMARY defense against cross-tenant data leaks.
 */
trait BelongsToSchool
{
    /**
     * Boot the trait — registers GlobalScope on every query.
     */
    public static function bootBelongsToSchool(): void
    {
        static::addGlobalScope('school_tenant', function (Builder $query) {
            $user = Auth::user();

            if ($user === null) {
                // No authenticated user → return empty result set, NEVER all records.
                // This prevents unauthenticated bulk data access.
                $query->whereRaw('1 = 0');
                return;
            }

            if ($user->role === 'super_admin') {
                // Super admin sees all — but only via /super/* routes (enforced by middleware)
                return;
            }

            if (empty($user->school_id)) {
                // Non-super-admin without school_id → deny everything
                $query->whereRaw('1 = 0');
                return;
            }

            $table = (new static())->getTable();
            $query->where("{$table}.school_id", '=', $user->school_id);
        });

        // Before creating any record, auto-inject school_id and verify it
        static::creating(function ($model) {
            $user = Auth::user();

            if ($user === null) {
                throw new RuntimeException('Cannot create record without authenticated user.');
            }

            if ($user->role === 'super_admin') {
                // Super admin must explicitly set school_id
                return;
      
