<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KategoriInstansi extends Model
{
    use HasFactory;

    /**
     * Nama tabel di database.
     * Secara default, Laravel akan mencari 'kategori_instansis', jadi kita perlu tentukan secara eksplisit.
     * @var string
     */
    protected $table = 'kategori_instansi';

    /**
     * Atribut yang dapat diisi secara massal (mass assignable).
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Mendefinisikan relasi satu-ke-banyak (One-to-Many) dengan model Instansi.
     * Satu KategoriInstansi bisa memiliki banyak Instansi.
     */
    public function instansis(): HasMany
    {
        return $this->hasMany(Instansi::class, 'id_kategori_instansi');
    }
}