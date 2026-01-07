<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property Carbon $start_date
 * @property Carbon $end_date
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Promo extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'image_url'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function books()
    {
        return $this->belongsToMany(Buku::class, 'promo_buku', 'promo_id', 'buku_id')
            ->withPivot('discount_percent')
            ->withTimestamps();
    }
}
