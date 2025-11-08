<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MentalHealthController extends Controller
{
    // Menambahkan middleware autentikasi JWT di rute, bukan di constructor
    public function __construct()
    {
        // Tidak perlu menggunakan middleware di controller, cukup gunakan di rute
    }

    // Menampilkan halaman utama atau dashboard kesehatan mental
    public function index()
    {
        return view('mentalHealth.index');  // Tampilkan halaman utama untuk pengguna
    }

    // Fungsi untuk memulai konsultasi dengan AI
    public function consult(Request $request)
    {
        // Validasi input (pertanyaan)
        $validated = $request->validate([
            'question' => 'required|string|max:500',  // Validasi pertanyaan (maksimal 500 karakter)
        ]);

        // Ambil pertanyaan dari request
        $question = $validated['question'];

        // Kirim pertanyaan ke API AI (Google Gemini)
        $response = $this->callGoogleGenAI($question);

        // Kembalikan respons ke view
        return view('mentalHealth.consult', compact('response'));
    }

    // Fungsi untuk berinteraksi dengan API Google Gemini AI
    private function callGoogleGenAI($question)
    {
        // Ambil API Key dan Model dari .env
        $apiKey = env('GOOGLE_GENAI_API_KEY');
        $model = env('GOOGLE_GENAI_MODEL');

        // URL API Google Gemini (contoh)
        $apiUrl = 'https://gemini.googleapis.com/v1/models/' . $model . ':predict';

        // Header dan body request
        $headers = [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ];

        $body = [
            'instances' => [
                [
                    'input' => $question,
                    'context' => env('AI_SYSTEM_PROMPT'),  // Prompt sistem dari .env
                ]
            ]
        ];

        // Melakukan request ke API Google Gemini
        try {
            $response = Http::withHeaders($headers)->post($apiUrl, $body);

            // Menangani respons API jika berhasil
            if ($response->successful()) {
                return $response->json();  // Mengembalikan hasil dari AI
            } else {
                // Jika ada masalah dengan API, kembalikan error
                return ['error' => 'Terjadi kesalahan saat menghubungi Google Gemini AI.'];
            }
        } catch (\Exception $e) {
            // Menangani kesalahan pada koneksi API
            return ['error' => 'Terjadi kesalahan dalam mengakses API AI: ' . $e->getMessage()];
        }
    }
}
