<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Instansi extends Model
{
    use HasFactory;

    /**
     * Nama tabel di database.
     * Secara default, Laravel akan mencari 'instansis', jadi kita perlu tentukan secara eksplisit.
     * @var string
     */
    protected $table = 'instansi';

    /**
     * Atribut yang dapat diisi secara massal (mass assignable).
     * Semua kolom selain id dan timestamps dimasukkan.
     * @var array<int, string>
     */
    protected $fillable = [
        'kategori',
        'instansi',
        'proses_bisnis_as_is', 'layanan_as_is', 'data_info_as_is', 'aplikasi_as_is',
        'infra_as_is', 'keamanan_as_is',
        'proses_bisnis_to_be', 'layanan_to_be', 'data_info_to_be', 'aplikasi_to_be',
        'infra_to_be', 'keamanan_to_be',
        'peta_rencana', 'clearance', 'reviueval', 'tingkat_kematangan',
    ];

    /**
     * Atribut yang harus di-cast ke tipe data tertentu (misalnya boolean).
     * @var array<string, string>
     */
    protected $casts = [
        'peta_rencana' => 'boolean',
        'clearance' => 'boolean',
        'reviueval' => 'boolean',
        'tingkat_kematangan' => 'integer',
    ];
}