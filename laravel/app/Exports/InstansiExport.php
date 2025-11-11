<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;

/**
 * Placeholder InstansiExport: export functionality removed but class kept to
 * avoid autoload/classmap issues. Methods throw to make accidental usage fail
 * clearly.
 */
class InstansiExport implements FromCollection, WithHeadings, ShouldAutoSize
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
