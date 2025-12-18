<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gratitudes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->text('item_1'); // First gratitude
            $table->text('item_2')->nullable(); // Second gratitude (optional)
            $table->text('item_3')->nullable(); // Third gratitude (optional)
            $table->string('category_1')->nullable(); // Auto-detected category
            $table->string('category_2')->nullable();
            $table->string('category_3')->nullable();
            $table->timestamps();
            
            // Ensure one gratitude entry per day per user
            $table->unique(['user_id', 'date']);
        });

        // Gratitude categories reference table
        Schema::create('gratitude_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Friends, Health, Work, Nature, etc
            $table->string('emoji'); // 👥, 💪, 💼, 🌿, etc
            $table->string('color'); // Hex color for UI
            $table->json('keywords'); // Keywords for auto-categorization
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gratitudes');
        Schema::dropIfExists('gratitude_categories');
    }
};