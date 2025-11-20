<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * Placeholder InstansiExport: export functionality removed but class kept to
 * avoid autoload/classmap issues. Methods throw to make accidental usage fail
 * clearly.
 */
class InstansiExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(int $kategoriId = 0)
    {
        // no-op
    }

    public function collection(): Collection
    {
        throw new \RuntimeException('Instansi export has been removed.');
    }

    public function headings(): array
    {
        return ['Removed'];
    }
}
