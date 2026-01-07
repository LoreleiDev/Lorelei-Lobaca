<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Buku extends Model
{
    protected $table = 'buku';
    protected $primaryKey = 'buku_id';
    public $timestamps = true;

    protected $fillable = [
        'judul',
        'penulis',
        'penerbit',
        'stok',
        'kondisi',
        'foto',
        'deskripsi',
        'kategori',
        'harga',
        'berat',
        'isbn',
        'tahun',
        'admin_id',
    ];

    // Relation
    public function admin()
    {
        return $this->belongsTo(Admin::class, 'admin_id', 'admin_id');
    }
    public function cartItems()
    {
        return $this->hasMany(CartItem::class, 'buku_id', 'buku_id');
    }
    public function promo()
    {
        return $this->belongsToMany(Promo::class, 'promo_buku', 'buku_id', 'promo_id')
            ->withPivot('discount_percent')
            ->withTimestamps();
    }
    public function reviews()
    {
        return $this->hasMany(Review::class, 'book_id', 'buku_id');
    }
    public function getAverageRatingAttribute()
    {
        $avg = $this->reviews()->avg('rating');
        return $avg ? round($avg, 1) : 0;
    }
}
