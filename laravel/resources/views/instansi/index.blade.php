<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Arsitektur Instansi</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.datatables.net/2.0.8/css/dataTables.bootstrap5.css">
        <style>
            .table-responsive {
                margin-top: 20px;
            }
            .nav-tabs .nav-link {
                color: #495057; /* Warna default tab */
            }
            .nav-tabs .nav-link.active {
                color: #0d6efd; /* Warna biru untuk tab aktif */
                border-bottom: 3px solid #0d6efd;
                border-radius: 0;
            }
            /* Style untuk header tabel bertingkat */
            .table thead th {
                vertical-align: middle;
                text-align: center;
            }
            .table thead tr:first-child th {
                border-bottom: none;
            }
        </style>
    </head>
    <body>

    <div class="container-fluid">
        
        <ul class="nav nav-tabs border-0" role="tablist">
            <li class="nav-item">
                <a class="nav-link active" data-bs-toggle="tab" data-kategori-id="1" href="#kementerian" role="tab">Kementerian</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" data-kategori-id="2" href="#lpns" role="tab">LPNK</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" data-kategori-id="3" href="#lns" role="tab">LNS</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" data-kategori-id="4" href="#instansilain" role="tab">Instansi Lain</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" data-kategori-id="5" href="#provinsi" role="tab">Provinsi</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-bs-toggle="tab" data-kategori-id="6" href="#kabkota" role="tab">Kab/Kota</a>
            </li>
        </ul>

        <div class="mt-3 d-flex">
            <button id="refresh-data" class="btn btn-primary me-2">Refresh All Data</button>
            <button id="download-excel" class="btn btn-success">Download Rekap Excel</button>
        </div>

        <div class="table-responsive">
            <table id="instansi-table" class="table table-striped table-bordered" style="width:100%">
                <thead>
                    <tr>
                        <th rowspan="2">Instansi</th>
                        <th colspan="6">Arsitektur As-Is</th>
                        <th colspan="6">Arsitektur To-Be</th>
                        <th rowspan="2">Peta Rencana</th>
                        <th rowspan="2">Clearance</th>
                        <th rowspan="2">Reviu dan Evaluasi</th>
                        <th rowspan="2">Tingkat Kematangan</th>
                        <th rowspan="2">Aksi</th>
                    </tr>
                    <tr>
                        <th>Proses Bisnis <i class="fa fa-sort"></i></th>
                        <th>Layanan <i class="fa fa-sort"></i></th>
                        <th>Data & Info <i class="fa fa-sort"></i></th>
                        <th>Aplikasi <i class="fa fa-sort"></i></th>
                        <th>Infra <i class="fa fa-sort"></i></th>
                        <th>Keamanan <i class="fa fa-sort"></i></th>
                        <th>Proses Bisnis <i class="fa fa-sort"></i></th>
                        <th>Layanan <i class="fa fa-sort"></i></th>
                        <th>Data & Info <i class="fa fa-sort"></i></th>
                        <th>Aplikasi <i class="fa fa-sort"></i></th>
                        <th>Infra <i class="fa fa-sort"></i></th>
                        <th>Keamanan <i class="fa fa-sort"></i></th>
                        </tr>
                </thead>
                <tbody>
                    </tbody>
            </table>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.datatables.net/2.0.8/js/dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/2.0.8/js/dataTables.bootstrap5.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">


    <script>
        $(document).ready(function() {
            // Fungsi untuk mendapatkan URL API berdasarkan ID Kategori
            function getApiUrl(kategoriId) {
                // Menggunakan fungsi route() Laravel yang di-inject via Blade
                return "{{ route('instansi.data.json.filter', ['kategoriId' => 'REPLACE_ID']) }}".replace('REPLACE_ID', kategoriId);
            }
    
            // Inisialisasi DataTables: Mulai dengan Kategori ID 1 (Kementerian)
            var table = $('#instansi-table').DataTable({
                processing: true,
                serverSide: false,
                ajax: {
                    url: getApiUrl(1), // Mengambil data Kategori 1 saat pertama kali load
                    type: 'GET',
                    error: function(xhr, error, code) {
                        console.error("AJAX Error Details:", xhr.status, xhr.responseText);
                        alert('Gagal memuat data. Status: ' + xhr.status);
                    },
                    dataSrc: 'data'
                },
                // ... (Definisi kolom-kolom yang ada (18 kolom) tetap sama di sini) ...
                
                // Kolom-kolom harus tetap didefinisikan secara lengkap di sini.
                columns: [
                    // Kolom 1: Instansi
                    { data: 'instansi', name: 'instansi' },
                    
                    // Kolom As-Is (Kolom 2 - 7)
                    { 
                        data: 'proses_bisnis_as_is', 
                        name: 'proses_bisnis_as_is',
                        
                    },
                    { 
                        data: 'layanan_as_is', 
                        name: 'layanan_as_is',
                        // render: function(data) { return data === 1 ? '✅' : '❌'; }
                    },
                    { data: 'data_info_as_is', name: 'data_info_as_is' },
                    { data: 'aplikasi_as_is', name: 'aplikasi_as_is' },
                    { data: 'infra_as_is', name: 'infra_as_is' },
                    { data: 'keamanan_as_is', name: 'keamanan_as_is' },
    
                    // Kolom To-Be (Kolom 8 - 13)
                    { data: 'proses_bisnis_to_be', name: 'proses_bisnis_to_be' },
                    { data: 'layanan_to_be', name: 'layanan_to_be' },
                    { data: 'data_info_to_be', name: 'data_info_to_be' },
                    { data: 'aplikasi_to_be', name: 'aplikasi_to_be' },
                    { data: 'infra_to_be', name: 'infra_to_be' },
                    { data: 'keamanan_to_be', name: 'keamanan_to_be' },
                    
                    // --- KOLOM TAMBAHAN BARU SESUAI GAMBAR ---
                    
                    // Kolom 14: Peta Rencana
                    { 
                        data: 'peta_rencana', 
                        name: 'peta_rencana',
                        render: function(data) {
                            // Data dari DB adalah boolean (true/false) atau integer (1/0)
                            return data ? '<span class="badge bg-success">Sudah Ada</span>' : '<span class="badge bg-danger">Belum</span>';
                        }
                    },
                    // Kolom 15: Clearance
                    { 
                        data: 'clearance', 
                        name: 'clearance',
                        render: function(data) {
                            return data ? '✅' : '❌';
                        }
                    },
                    // Kolom 16: Reviu dan Evaluasi
                    { 
                        data: 'reviueval', 
                        name: 'reviueval',
                        render: function(data) {
                            return data ? '✅' : '❌';
                        }
                    },
                    // Kolom 17: Tingkat Kematangan
                    { 
                        data: 'tingkat_kematangan', 
                        name: 'tingkat_kematangan',
                        render: function(data) {
                            // Tentukan warna badge berdasarkan tingkat kematangan
                            var badgeColor = 'bg-secondary';
                            if (data >= 4) {
                                badgeColor = 'bg-success'; // Baik (4 & 5)
                            } else if (data >= 2) {
                                badgeColor = 'bg-warning text-dark'; // Sedang (2 & 3)
                            } else if (data == 1) {
                                badgeColor = 'bg-danger'; // Rendah (1)
                            }
                            
                            // Tampilkan nilai 1-5 sebagai badge
                            return '<span class="badge ' + badgeColor + '">' + data + '</span>';
                        }
                    },
                    // Kolom 18: Aksi (<tombol refresh>)
                    { 
                        data: null, // Kolom kustom, tidak terikat langsung ke satu field
                        name: 'aksi',
                        orderable: false, // Tidak bisa di-sort
                        searchable: false, // Tidak bisa di-search
                        render: function(data, type, row) {
                            // Tombol Aksi per baris data (menggunakan ID baris)
                            return '<button class="btn btn-sm btn-info btn-refresh-row" data-id="' + row.id + '" title="Refresh data baris ini"><i class="fas fa-sync"></i> Refresh</button>';
                        }
                    },
                ],
                // ... (pengaturan dom, buttons, dan language tetap sama) ...
            });
    
            // Event Listener: Muat data baru saat tab diklik
            $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
                var selectedKategoriId = $(e.target).data('kategori-id');
                var newUrl = getApiUrl(selectedKategoriId);
    
                // Perbarui URL AJAX DataTables dan muat ulang data tanpa refresh halaman
                table.ajax.url(newUrl).load(null, true); // true: reset pagination
            });
            
            // Event listener untuk tombol "Refresh All Data" (Tombol biru di atas)
            $('#refresh-data').on('click', function() {
                // Ambil ID kategori yang sedang aktif
                var activeKategoriId = $('a.nav-link.active').data('kategori-id');
                var currentUrl = getApiUrl(activeKategoriId);
                
                table.ajax.url(currentUrl).load(null, false); // false: tetap di halaman saat ini
                console.log('Data Kategori ID ' + activeKategoriId + ' berhasil diperbarui!');
            });
            
            // ... (Event listener untuk tombol Aksi per baris tetap sama) ...
    
        });

        $(document).ready(function() {
            // Fungsi untuk mendapatkan URL API dan Export
            function getExportUrl(kategoriId) {
                return "{{ route('instansi.export.excel', ['kategoriId' => 'REPLACE_ID']) }}".replace('REPLACE_ID', kategoriId);
            }
            
            // ... (inisialisasi DataTables) ...

            // Event listener untuk tombol "Download Rekap Excel"
            $('#download-excel').on('click', function() {
                // 1. Dapatkan ID kategori yang sedang aktif
                var activeKategoriId = $('a.nav-link.active').data('kategori-id');
                
                if (!activeKategoriId) {
                    alert('Pilih kategori instansi terlebih dahulu.');
                    return;
                }

                // 2. Buat URL ekspor yang difilter
                var exportUrl = getExportUrl(activeKategoriId);

                // 3. Arahkan browser untuk mengunduh file
                window.location.href = exportUrl;
            });

            // ... (Event listeners lainnya: Refresh All Data dan Tab Click) ...
        });
    </script>

    </body>
</html>