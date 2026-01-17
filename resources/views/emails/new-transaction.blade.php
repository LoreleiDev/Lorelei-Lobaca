<!DOCTYPE html>
<html>
<head>
    <title>Transaksi Baru</title>
</head>
<body>
    <h2>Transaksi Baru Diterima</h2>
    <p>ID Transaksi: {{ $transaksi->transaksi_id }}</p>
    <p>Total: Rp {{ number_format($transaksi->total_harga, 0, ',', '.') }}</p>
    <p>Pengguna ID: {{ $transaksi->user_id }}</p>
    <p>Status: {{ $transaksi->status_transaksi }}</p>
</body>
</html>