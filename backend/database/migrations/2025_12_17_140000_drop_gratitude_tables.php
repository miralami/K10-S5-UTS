<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('gratitudes');
        Schema::dropIfExists('gratitude_categories');
    }

    public function down(): void
    {
        Schema::create('gratitudes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->text('item_1');
            $table->text('item_2')->nullable();
            $table->text('item_3')->nullable();
            $table->string('category_1')->nullable();
            $table->string('category_2')->nullable();
            $table->string('category_3')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'date']);
        });

        Schema::create('gratitude_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('emoji');
            $table->string('color');
            $table->json('keywords');
            $table->timestamps();
        });
    }
};
