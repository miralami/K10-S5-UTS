<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, add a date column if it doesn't exist
        Schema::table('journal_notes', function (Blueprint $table) {
            if (! Schema::hasColumn('journal_notes', 'note_date')) {
                $table->date('note_date')->nullable()->after('body');
            }
        });

        // Update existing records to set note_date from created_at
        DB::statement('UPDATE journal_notes SET note_date = DATE(created_at)');

        // Create a temporary table to store the latest note for each user per day
        DB::statement('CREATE TEMPORARY TABLE temp_notes AS 
            SELECT id, user_id, note_date, created_at
            FROM journal_notes
            WHERE (user_id, note_date, created_at) IN (
                SELECT user_id, note_date, MAX(created_at)
                FROM journal_notes
                GROUP BY user_id, note_date
            )');

        // Truncate the original table
        DB::table('journal_notes')->truncate();

        // Re-insert the deduplicated data
        DB::statement('INSERT INTO journal_notes (id, user_id, note_date, created_at, updated_at, title, body)
            SELECT n.id, n.user_id, n.note_date, n.created_at, NOW() as updated_at, 
                   (SELECT title FROM journal_notes WHERE id = n.id) as title,
                   (SELECT body FROM journal_notes WHERE id = n.id) as body
            FROM temp_notes n');

        // Drop the temporary table
        DB::statement('DROP TEMPORARY TABLE IF EXISTS temp_notes');

        // Make note_date not nullable and add unique constraint
        Schema::table('journal_notes', function (Blueprint $table) {
            $table->date('note_date')->nullable(false)->change();

            // Add unique constraint
            $table->unique(['user_id', 'note_date'], 'user_date_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journal_notes', function (Blueprint $table) {
            $table->dropUnique('user_date_unique');
            $table->dropColumn('note_date');
        });
    }
};
