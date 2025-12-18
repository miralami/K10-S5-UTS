<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_notes', function (Blueprint $table) {
            $table->text('gratitude_1')->nullable()->after('body');
            $table->text('gratitude_2')->nullable()->after('gratitude_1');
            $table->text('gratitude_3')->nullable()->after('gratitude_2');
            $table->string('gratitude_category_1')->nullable()->after('gratitude_3');
            $table->string('gratitude_category_2')->nullable()->after('gratitude_category_1');
            $table->string('gratitude_category_3')->nullable()->after('gratitude_category_2');
        });
    }

    public function down(): void
    {
        Schema::table('journal_notes', function (Blueprint $table) {
            $table->dropColumn([
                'gratitude_1',
                'gratitude_2',
                'gratitude_3',
                'gratitude_category_1',
                'gratitude_category_2',
                'gratitude_category_3',
            ]);
        });
    }
};
