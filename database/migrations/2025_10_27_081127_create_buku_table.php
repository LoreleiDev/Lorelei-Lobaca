<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('buku', function (Blueprint $table) {
            $table->id('buku_id'); 
            $table->unsignedBigInteger('admin_id'); 
            $table->string('judul');
            $table->string('penulis');
            $table->string('penerbit');
            $table->integer('stok');
            $table->string('kondisi'); 
            $table->string('foto')->nullable(); 
            $table->text('deskripsi')->nullable();
            $table->decimal('harga', 10, 2); 
            $table->integer('berat'); 
            $table->string('isbn')->nullable();
            $table->string('kategori')->nullable();
            $table->year('tahun'); 
            $table->timestamps(); 
            $table->foreign('admin_id')->references('admin_id')->on('admins')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('buku');
    }
};