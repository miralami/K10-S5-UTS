<?php

namespace App\Http\Controllers;

use App\Models\Instansi;
use App\Exports\InstansiExport;
use Maatwebsite\Excel\Facades\Excel; 
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class InstansiController extends Controller
{
    /**
     * Menampilkan daftar semua Instansi.
     */
    public function index()
    {
        // Ambil data Instansi, sertakan relasi kategori dan daerah untuk menghindari N+1 query problem
        $instansis = Instansi::query()->latest()->get();

        return response()->json([
            'data' => $instansis,
        ]);
    }

    /**
     * Menampilkan form untuk membuat Instansi baru.
     */
    public function create()
    {
        $kategoris = Instansi::query()
            ->select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori');

        return response()->json([
            'kategoris' => $kategoris,
        ]);
    }

    /**
     * Menyimpan Instansi baru ke database.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), $this->validationRules());

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $this->preparePayload($validator->validated());
        $instansi = Instansi::create($payload);

        return response()->json([
            'message' => 'Instansi berhasil ditambahkan!',
            'data' => $instansi,
        ], 201);
    }

    /**
     * Menampilkan detail Instansi tertentu.
     */
    public function show(Instansi $instansi)
    {
        // Muat relasi kategori dan daerah
        return response()->json([
            'data' => $instansi,
        ]);
    }

    /**
     * Menampilkan form untuk mengedit Instansi tertentu.
     */
    public function edit(Instansi $instansi)
    {
        $kategoris = Instansi::query()
            ->select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori');

        return response()->json([
            'data' => $instansi,
            'kategoris' => $kategoris,
        ]);
    }

    /**
     * Memperbarui Instansi tertentu di database.
     */
    public function update(Request $request, Instansi $instansi)
    {
        $validator = Validator::make($request->all(), $this->validationRules(true));

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $this->preparePayload($validator->validated());
        $instansi->update($payload);

        return response()->json([
            'message' => 'Instansi berhasil diperbarui!',
            'data' => $instansi,
        ]);
    }

    /**
     * Menghapus Instansi tertentu dari database.
     */
    public function destroy(Instansi $instansi)
    {
        $instansi->delete();

        return response()->json([
            'message' => 'Instansi berhasil dihapus!',
        ]);
    }

    // app/Http/Controllers/InstansiController.php
    public function apiData()
    {
        // Ambil SEMUA kolom yang dibutuhkan di DataTables
        $instansis = Instansi::query()
            ->select([
                'id',
                'kategori',
                'instansi',
                'proses_bisnis_as_is', 'layanan_as_is', 'data_info_as_is',
                'aplikasi_as_is', 'infra_as_is', 'keamanan_as_is',
                'proses_bisnis_to_be', 'layanan_to_be', 'data_info_to_be',
                'aplikasi_to_be', 'infra_to_be', 'keamanan_to_be',
                'peta_rencana', 'clearance', 'reviueval', 'tingkat_kematangan',
            ])
            ->get();

        // Pastikan response menggunakan format DataTables standar: {'data': [...]}
        return response()->json([
            'data' => $instansis
        ]);
    }
    
        public function getInstansiByKategoriId($kategori)
        {
            $kategori = urldecode($kategori);

            if (!is_string($kategori) || $kategori === '') {
                return response()->json(['error' => 'Invalid category'], 400);
            }

            $instansis = Instansi::query()
                ->where('kategori', $kategori)
                ->select([
                    'id',
                    'kategori',
                    'instansi',
                    'proses_bisnis_as_is', 'layanan_as_is', 'data_info_as_is',
                    'aplikasi_as_is', 'infra_as_is', 'keamanan_as_is',
                    'proses_bisnis_to_be', 'layanan_to_be', 'data_info_to_be',
                    'aplikasi_to_be', 'infra_to_be', 'keamanan_to_be',
                    'peta_rencana', 'clearance', 'reviueval', 'tingkat_kematangan',
                ])
                ->get();

            // Mengembalikan data dalam format DataTables standar: {'data': [...]}
            return response()->json([
                'data' => $instansis
            ]);
        }

    public function exportExcel(string $kategori)
    {
        $kategori = urldecode($kategori);

        if (!is_string($kategori) || $kategori === '') {
            return response()->json(['error' => 'Invalid category'], 400);
        }

        $slug = str($kategori)->slug('_');
        $namaFile = 'rekap_instansi_' . $slug . '_' . now()->format('Ymd_His') . '.xlsx';

        // Sekarang, 'Excel' akan merujuk ke Maatwebsite\Excel\Facades\Excel dan tidak akan error.
        return Excel::download(new InstansiExport($kategori), $namaFile);
    }

    private function validationRules(bool $isUpdate = false): array
    {
        $requiredRule = $isUpdate ? ['sometimes', 'required'] : ['required'];

        return [
            'kategori' => array_merge($requiredRule, ['string', 'max:255']),
            'instansi' => array_merge($requiredRule, ['string', 'max:255']),
            'proses_bisnis_as_is' => ['nullable', 'integer', 'min:0'],
            'layanan_as_is' => ['nullable', 'integer', 'min:0'],
            'data_info_as_is' => ['nullable', 'integer', 'min:0'],
            'aplikasi_as_is' => ['nullable', 'integer', 'min:0'],
            'infra_as_is' => ['nullable', 'integer', 'min:0'],
            'keamanan_as_is' => ['nullable', 'integer', 'min:0'],
            'proses_bisnis_to_be' => ['nullable', 'integer', 'min:0'],
            'layanan_to_be' => ['nullable', 'integer', 'min:0'],
            'data_info_to_be' => ['nullable', 'integer', 'min:0'],
            'aplikasi_to_be' => ['nullable', 'integer', 'min:0'],
            'infra_to_be' => ['nullable', 'integer', 'min:0'],
            'keamanan_to_be' => ['nullable', 'integer', 'min:0'],
            'peta_rencana' => ['nullable', 'boolean'],
            'clearance' => ['nullable', 'boolean'],
            'reviueval' => ['nullable', 'boolean'],
            'tingkat_kematangan' => ['nullable', 'integer', 'min:0'],
        ];
    }

    private function preparePayload(array $data): array
    {
        $booleanFields = ['peta_rencana', 'clearance', 'reviueval'];

        foreach ($booleanFields as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = (bool) $data[$field];
            }
        }

        return $data;
    }
}