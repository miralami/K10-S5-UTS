Perlu dilakukan instalasi package melalui composer dengan command:
composer require yajra/laravel-datatables-oracle:"^12.0"

(Jika error, coba lakukan langkah berikutnya)

Setelah itu lakukan publish file config dengan command:
php artisan vendor:publish --provider="Yajra\DataTables\DataTablesServiceProvider"
