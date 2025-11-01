<?php

namespace App\Exports;

use App\Models\Instansi;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;

class InstansiExport implements FromCollection, WithHeadings, ShouldAutoSize
{
    protected $kategoriId;

    public function __construct(int $kategoriId)
    {
        $this->kategoriId = $kategoriId;
    }

    /**
    * Mengambil koleksi data yang akan diekspor.
    * @return \Illuminate\Support\Collection
    */
    public function collection(): Collection
    {
        return Instansi::where('id_kategori_instansi', $this->kategoriId)
            ->select(
                'instansi',
                'proses_bisnis_as_is', 'layanan_as_is', 'data_info_as_is',
                'aplikasi_as_is', 'infra_as_is', 'keamanan_as_is',
                'proses_bisnis_to_be', 'layanan_to_be', 'data_info_to_be',
                'aplikasi_to_be', 'infra_to_be', 'keamanan_to_be',
                'peta_rencana', 'clearance', 'reviueval', 'tingkat_kematangan'
            )
            ->get();
    }
    
    /**
    * Mendefinisikan header (judul kolom) untuk file Excel.
    * @return array
    */
    public function headings(): array
    {
        return [
            'Instansi',
            'PB As-Is', 'Layanan As-Is', 'Data Info As-Is', 'Aplikasi As-Is', 'Infra As-Is', 'Keamanan As-Is',
            'PB To-Be', 'Layanan To-Be', 'Data Info To-Be', 'Aplikasi To-Be', 'Infra To-Be', 'Keamanan To-Be',
            'Peta Rencana', 'Clearance', 'Reviu & Evaluasi', 'Tingkat Kematangan',
        ];
    }
}