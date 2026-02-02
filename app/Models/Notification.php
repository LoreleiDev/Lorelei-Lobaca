<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'notification_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    protected $fillable = [
        'notification_id',
        'user_id',
        'type',
        'title',
        'message',
        'order_id',
        'data',
        'is_read'
    ];
    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime'
    ];
    public static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->notification_id)) {
                $model->notification_id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}