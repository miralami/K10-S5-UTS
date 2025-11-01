<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_create_instansi_table.php
    public function up()
    {
        Schema::create('instansi', function (Blueprint $table) {
            $table->id();
            $table->string('kategori');
            $table->string('instansi');
            $table->unsignedTinyInteger('proses_bisnis_as_is')->default(0);
            $table->unsignedTinyInteger('layanan_as_is')->default(0);
            $table->unsignedTinyInteger('data_info_as_is')->default(0);
            $table->unsignedTinyInteger('aplikasi_as_is')->default(0);
            $table->unsignedTinyInteger('infra_as_is')->default(0);
            $table->unsignedTinyInteger('keamanan_as_is')->default(0);
            $table->unsignedTinyInteger('proses_bisnis_to_be')->default(0);
            $table->unsignedTinyInteger('layanan_to_be')->default(0);
            $table->unsignedTinyInteger('data_info_to_be')->default(0);
            $table->unsignedTinyInteger('aplikasi_to_be')->default(0);
            $table->unsignedTinyInteger('infra_to_be')->default(0);
            $table->unsignedTinyInteger('keamanan_to_be')->default(0);
            $table->boolean('peta_rencana')->default(false);
            $table->boolean('clearance')->default(false);
            $table->boolean('reviueval')->default(false);
            $table->unsignedTinyInteger('tingkat_kematangan')->default(0);
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instansi');
    }
};
