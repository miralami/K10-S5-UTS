<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Daerah extends Model
{
    use HasFactory;

    /**
     * Nama tabel di database.
     * Secara default, Laravel akan mencari 'daerahs', jadi kita perlu tentukan secara eksplisit.
     * @var string
     */
    protected $table = 'daerah';

    /**
     * Atribut yang dapat diisi secara massal (mass assignable).
     * @var array<int, string>
     */
    protected $fillable = [
        'desc',
    ];

    /**
     * Mendefinisikan relasi satu-ke-banyak (One-to-Many) dengan model Instansi.
     * Satu Daerah bisa memiliki banyak Instansi.
     */
    public function instansis(): HasMany
    {
        return $this->hasMany(Instansi::class, 'id_daerah');
    }
}