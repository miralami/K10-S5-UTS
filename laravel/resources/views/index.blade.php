<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Tabel Instansi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- DataTables and extensions CSS -->
    <link href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/fixedheader/3.4.0/css/fixedHeader.dataTables.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/buttons/2.4.1/css/buttons.dataTables.min.css" rel="stylesheet">
    <link href="https://cdn.datatables.net/responsive/2.5.0/css/responsive.dataTables.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

    <style>
        /* Custom DataTables styling */
        .dataTables_wrapper {
            @apply mb-4;
        }

        .dataTables_wrapper .dataTables_length select {
            @apply px-4 py-2 border border-gray-300 rounded-lg bg-white;
        }

        .dataTables_wrapper .dataTables_filter input {
            @apply px-4 py-2 border border-gray-300 rounded-lg;
        }

        .dataTables_wrapper .dataTables_paginate .paginate_button.current {
            @apply bg-blue-500 text-white px-3 py-1 rounded border-0;
        }

        .dataTables_wrapper .dataTables_paginate .paginate_button:not(.current):hover {
            @apply bg-blue-100 text-blue-600 border-0;
        }

        /* Table styling */
        table.dataTable {
            @apply w-full border-collapse;
        }

        table.dataTable thead th {
            @apply bg-gray-100 text-gray-700 font-semibold px-4 py-2 border-b;
            white-space: nowrap;
        }

        table.dataTable tbody td {
            @apply px-4 py-2 border-b text-sm;
        }

        table.dataTable tbody tr:hover {
            @apply bg-gray-50;
        }

        /* Fixed header styling */
        .fixedHeader-floating {
            @apply shadow-lg;
        }

        /* Export buttons styling */
        .dt-buttons .dt-button {
            @apply bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-700 mr-2 hover:bg-gray-50;
        }

        /* Custom scrollbar */
        .dataTables_scrollBody::-webkit-scrollbar {
            @apply h-2;
        }

        .dataTables_scrollBody::-webkit-scrollbar-track {
            @apply bg-gray-100 rounded-full;
        }

        .dataTables_scrollBody::-webkit-scrollbar-thumb {
            @apply bg-gray-400 rounded-full hover:bg-gray-500;
        }
    </style>
    <!-- Core Scripts -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>

    <!-- DataTables Extensions -->
    <script src="https://cdn.datatables.net/fixedheader/3.4.0/js/dataTables.fixedHeader.min.js"></script>
    <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.1/js/dataTables.buttons.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.html5.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.print.min.js"></script>

    <script>
        $(document).ready(function() {
            let table = $('#myTable').DataTable({
                processing: true,
                serverSide: true,
                scrollX: true,
                scrollCollapse: true,
                fixedHeader: {
                    header: true,
                    headerOffset: 0
                },
                dom: 'Blfrtip',
                buttons: [
                    {
                        extend: 'copy',
                        text: '<i class="fas fa-copy mr-1"></i> Copy',
                        className: 'font-normal'
                    },
                    {
                        extend: 'csv',
                        text: '<i class="fas fa-file-csv mr-1"></i> CSV',
                        className: 'font-normal'
                    },
                    {
                        extend: 'excel',
                        text: '<i class="fas fa-file-excel mr-1"></i> Excel',
                        className: 'font-normal'
                    },
                    {
                        extend: 'print',
                        text: '<i class="fas fa-print mr-1"></i> Print',
                        className: 'font-normal'
                    }
                ],
                ajax: {
                    url: "{{ route('instansi.data') }}",
                    type: "POST",
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    error: function(xhr, error, thrown) {
                        console.error('Data request failed:', error);
                        console.error('Server response:', xhr.responseText);
                    }
                },
                columns: [
                    {data: 'DT_RowIndex', name: 'DT_RowIndex', orderable: false, searchable: false},
                    {data: 'nama_instansi', name: 'nama_instansi'},
                    {data: 'alamat', name: 'alamat'},
                    {data: 'kota', name: 'kota'},
                    {data: 'latitude', name: 'latitude'},
                    {data: 'longitude', name: 'longitude'},
                    {data: 'tipe_bangunan', name: 'tipe_bangunan'},
                    {data: 'pondasi', name: 'pondasi'},
                    {data: 'tipe_rangka', name: 'tipe_rangka'},
                    {data: 'dinding_struktur', name: 'dinding_struktur'},
                    {data: 'struktur_plat_lantai', name: 'struktur_plat_lantai'},
                    {data: 'struktur_tangga', name: 'struktur_tangga'},
                    {data: 'rangka_atap', name: 'rangka_atap'},
                    {data: 'penerangan', name: 'penerangan'},
                    {data: 'telekomunikasi', name: 'telekomunikasi'},
                    {data: 'tata_udara', name: 'tata_udara'},
                    {data: 'sanitasi', name: 'sanitasi'},
                    {data: 'created_at', name: 'created_at'},
                    {data: 'updated_at', name: 'updated_at'},
                ],
                order: [[1, 'asc']],
                pageLength: 10,
                responsive: true,
                language: {
                    processing: '<i class="fas fa-spinner fa-spin fa-2x fa-fw"></i><span class="sr-only">Loading...</span>',
                    searchPlaceholder: "Cari data...",
                    lengthMenu: "Tampilkan _MENU_ data per halaman",
                    zeroRecords: "Data tidak ditemukan",
                    info: "Menampilkan halaman _PAGE_ dari _PAGES_",
                    infoEmpty: "Tidak ada data yang tersedia",
                    infoFiltered: "(difilter dari _MAX_ total data)",
                    paginate: {
                        first: '<i class="fas fa-angle-double-left"></i>',
                        last: '<i class="fas fa-angle-double-right"></i>',
                        next: '<i class="fas fa-angle-right"></i>',
                        previous: '<i class="fas fa-angle-left"></i>'
                    },
                }
            });

            // Handle window resize to adjust fixed header
            $(window).on('resize', function() {
                table.fixedHeader.adjust();
            });
        });
    </script>
</head>
<body class="bg-gray-100">

    <!-- Navbar -->
    <nav class="bg-white shadow mb-6">
        <div class="max-w-7xl mx-auto px-4 flex space-x-4">
            @foreach (['Kementerian','LPNK','LNS','InstansiLain','Provinsi','KabKota'] as $nav)
                <a href="{{ route('instansi.index', ['kategori' => $nav]) }}"
                   class="py-3 px-4 kategori-link {{ $kategori==$nav ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-blue-600' }}"
                   data-kategori="{{ $nav }}">
                    {{ $nav == 'InstansiLain' ? 'Instansi Lain' : ($nav == 'KabKota' ? 'Kab/Kota' : $nav) }}
                </a>
            @endforeach
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4">
        <!-- Alert -->
        <div id="alert-box" class="hidden mb-4 p-3 rounded"></div>

        <!-- Refresh All -->
        <button id="refresh-all"
            class="mb-3 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
            Refresh All Data
        </button>

        <!-- Table -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
            <table id="instansi-table" class="min-w-full text-sm">
                <thead class="bg-gray-100 text-gray-700">
                    <tr>
                        <th rowspan="2" class="px-4 py-2">Instansi</th>
                        <th colspan="6" class="px-4 py-2 text-center">Arsitektur As-Is</th>
                        <th colspan="6" class="px-4 py-2 text-center">Arsitektur To-Be</th>
                        <th rowspan="2" class="px-4 py-2">Peta Rencana</th>
                        <th rowspan="2" class="px-4 py-2">Clearance</th>
                        <th rowspan="2" class="px-4 py-2">Reviu dan Evaluasi</th>
                        <th rowspan="2" class="px-4 py-2">Tingkat Kematangan</th>
                        <th rowspan="2" class="px-4 py-2">Aksi</th>
                    </tr>
                    <tr class="bg-gray-50">
                        <th>Proses Bisnis</th><th>Layanan</th><th>Data & Info</th>
                        <th>Aplikasi</th><th>Infra</th><th>Keamanan</th>
                        <th>Proses Bisnis</th><th>Layanan</th><th>Data & Info</th>
                        <th>Aplikasi</th><th>Infra</th><th>Keamanan</th>
                    </tr>
                </thead>
            </table>
        </div>
    </div>

    <script>
        let table;
        const alertBox = document.getElementById('alert-box');

        function showAlert(message, success = true) {
            alertBox.textContent = message;
            alertBox.className = success
                ? "mb-4 p-3 rounded bg-green-100 text-green-700"
                : "mb-4 p-3 rounded bg-red-100 text-red-700";
            alertBox.classList.remove("hidden");
            setTimeout(() => alertBox.classList.add("hidden"), 3000);
        }

        function initDataTable(kategori) {
            if (table) {
                table.destroy();
            }

            table = $('#instansi-table').DataTable({
                processing: true,
                serverSide: true,
                scrollX: true,
                scrollY: '60vh',
                scrollCollapse: true,
                fixedHeader: {
                    header: true,
                    headerOffset: 60
                },
                dom: 'Blfrtip',
                buttons: [
                    {
                        extend: 'copy',
                        text: '<i class="fas fa-copy mr-1"></i> Copy',
                        className: 'font-normal'
                    },
                    {
                        extend: 'csv',
                        text: '<i class="fas fa-file-csv mr-1"></i> CSV',
                        className: 'font-normal'
                    },
                    {
                        extend: 'excel',
                        text: '<i class="fas fa-file-excel mr-1"></i> Excel',
                        className: 'font-normal'
                    },
                    {
                        extend: 'print',
                        text: '<i class="fas fa-print mr-1"></i> Print',
                        className: 'font-normal'
                    }
                ],
                ajax: {
                    url: '{{ route('instansi.data', ['kategori' => 'Kementerian']) }}',
                    data: function(d) {
                        d.kategori = kategori;
                    },
                    headers: {
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    },
                    error: function(xhr, error, thrown) {
                        console.error('DataTables Ajax error:', error);
                        showAlert('Gagal memuat data: ' + error, false);
                    }
                },
                columns: [
                    { data: 'instansi', name: 'instansi' },
                    { data: 'proses_bisnis_as_is', name: 'proses_bisnis_as_is' },
                    { data: 'layanan_as_is', name: 'layanan_as_is' },
                    { data: 'data_info_as_is', name: 'data_info_as_is' },
                    { data: 'aplikasi_as_is', name: 'aplikasi_as_is' },
                    { data: 'infra_as_is', name: 'infra_as_is' },
                    { data: 'keamanan_as_is', name: 'keamanan_as_is' },
                    { data: 'proses_bisnis_to_be', name: 'proses_bisnis_to_be' },
                    { data: 'layanan_to_be', name: 'layanan_to_be' },
                    { data: 'data_info_to_be', name: 'data_info_to_be' },
                    { data: 'aplikasi_to_be', name: 'aplikasi_to_be' },
                    { data: 'infra_to_be', name: 'infra_to_be' },
                    { data: 'keamanan_to_be', name: 'keamanan_to_be' },
                    { data: 'peta_rencana_icon', name: 'peta_rencana' },
                    { data: 'clearance_icon', name: 'clearance' },
                    { data: 'reviueval_icon', name: 'reviueval' },
                    { data: 'tingkat_kematangan_display', name: 'tingkat_kematangan' },
                    {
                        data: 'action',
                        name: 'action',
                        orderable: false,
                        searchable: false
                    }
                ],
                order: [[0, 'asc']],
                pageLength: 10,
                dom: 'Blfrtip',
                language: {
                    search: "Cari:",
                    lengthMenu: "Tampilkan _MENU_ data",
                    info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                    infoEmpty: "Menampilkan 0 sampai 0 dari 0 data",
                    infoFiltered: "(difilter dari _MAX_ total data)",
                    zeroRecords: "Tidak ada data yang cocok",
                    paginate: {
                        first: "Pertama",
                        last: "Terakhir",
                        next: "Selanjutnya",
                        previous: "Sebelumnya"
                    }
                },
                drawCallback: function() {
                    bindRowRefresh();
                }
            });
        }

        function changeKategori(kategori) {
            // Update URL tanpa reload halaman
            window.history.pushState({}, '', '{{ route('instansi.index') }}?kategori=' + kategori);

            // Update tampilan tab yang aktif
            document.querySelectorAll('.kategori-link').forEach(link => {
                if (link.dataset.kategori === kategori) {
                    link.classList.add('border-b-2', 'border-blue-600', 'font-semibold', 'text-blue-600');
                    link.classList.remove('text-gray-600', 'hover:text-blue-600');
                } else {
                    link.classList.remove('border-b-2', 'border-blue-600', 'font-semibold', 'text-blue-600');
                    link.classList.add('text-gray-600', 'hover:text-blue-600');
                }
            });

            // Reload DataTable dengan kategori baru
            initDataTable(kategori);
        }

        // Refresh row handler
        function bindRowRefresh() {
            $('.refresh-btn').off('click').on('click', async function() {
                const btn = $(this);
                const id = btn.data('id');

                btn.html('...');
                try {
                    await table.ajax.reload();
                    showAlert('Data berhasil diperbarui!');
                } catch (err) {
                    showAlert('Gagal memperbarui data!', false);
                }
                btn.html('<i class="fas fa-sync-alt"></i>');
            });
        }

        // Refresh All handler
        $('#refresh-all').click(async function() {
            const btn = $(this);
            btn.text('Refreshing...');

            try {
                await table.ajax.reload();
                showAlert('Semua data berhasil diperbarui!');
            } catch (err) {
                showAlert('Gagal memperbarui data!', false);
            }

            btn.text('Refresh All Data');
        });

        // Initialize with default category
        initDataTable('{{ $kategori }}');
    </script>
</body>
</html>
