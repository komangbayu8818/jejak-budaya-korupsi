/* =========================================================
   JEJAK BUDAYA DI ERA DIGITAL — semua interaksi & animasi
   Tiap bagian diberi nomor supaya mudah dicari.
   ========================================================= */

// Cek apakah pengguna mematikan animasi di perangkatnya
const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fungsi bantu: membatasi angka di antara min dan max
function batasi(nilai, min, max) {
  return Math.min(Math.max(nilai, min), max);
}


/* ---------------------------------------------------------
   1. LOADER
   --------------------------------------------------------- */
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderAngka = document.getElementById('loader-angka');
const loaderTeks = document.getElementById('loader-teks');
const pesanLoader = ['Membuka berkas...', 'Membersihkan debu arsip...', 'Menyalakan api...', 'Siap dibongkar.'];

let persen = 0;
document.documentElement.style.overflow = 'hidden'; // kunci scroll selama loading

const jalanLoader = setInterval(function () {
  persen = Math.min(persen + Math.random() * 12 + 3, 100);
  loaderBar.style.width = persen + '%';
  loaderAngka.textContent = Math.floor(persen) + '%';
  loaderTeks.textContent = pesanLoader[Math.min(Math.floor(persen / 34), 3)];

  if (persen >= 100) {
    clearInterval(jalanLoader);
    setTimeout(cobaMasuk, 400);
  }
}, 90);

// Loading selesai: coba langsung nyalakan lagu.
// Kalau browser mengizinkan → langsung masuk website.
// Kalau diblokir → tampilkan tombol "Buka Arsip" (klik itulah yang menyalakan lagu).
function cobaMasuk() {
  putarMusik().then(function (berhasil) {
    if (berhasil) {
      selesaiLoading();
    } else {
      loaderTeks.textContent = 'Siap dibongkar.';
      const tombolMasuk = document.getElementById('tombol-masuk');
      tombolMasuk.classList.remove('hidden');
      document.getElementById('catatan-masuk').classList.remove('hidden');
      tombolMasuk.animate(
        [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 500, easing: 'cubic-bezier(.3,1.4,.5,1)' }
      );
      tombolMasuk.focus(); // bisa juga tekan Enter
      tombolMasuk.addEventListener('click', function (e) {
        e.stopPropagation();
        putarMusik();
        selesaiLoading();
      }, { once: true });
    }
  });
}

function selesaiLoading() {
  loader.classList.add('hilang');
  document.documentElement.style.overflow = '';

  // Elemen hero muncul satu per satu
  document.querySelectorAll('.hero-muncul').forEach(function (el, i) {
    el.style.transitionDelay = (0.3 + i * 0.15) + 's';
  });
  document.body.classList.add('siap');

  setTimeout(mulaiMengetik, 1200);
  setTimeout(function () { loader.remove(); }, 1200);
}


/* ---------------------------------------------------------
   2. NAVBAR, PROGRES SCROLL & TOMBOL KE ATAS
   --------------------------------------------------------- */
const navbar = document.getElementById('navbar');
const progresScroll = document.getElementById('progres-scroll');
const tombolAtas = document.getElementById('tombol-atas');
const linkNav = document.querySelectorAll('.link-nav');

function saatScroll() {
  const tinggiTotal = document.documentElement.scrollHeight - window.innerHeight;
  progresScroll.style.width = (window.scrollY / tinggiTotal * 100) + '%';

  // Navbar jadi gelap setelah turun sedikit
  if (window.scrollY > 60) {
    navbar.classList.add('bg-abu/80', 'backdrop-blur-md', 'border-b', 'border-debu');
  } else {
    navbar.classList.remove('bg-abu/80', 'backdrop-blur-md', 'border-b', 'border-debu');
  }

  // Tombol ke atas muncul setelah melewati hero
  const tampilkan = window.scrollY > window.innerHeight;
  tombolAtas.classList.toggle('opacity-0', !tampilkan);
  tombolAtas.classList.toggle('translate-y-10', !tampilkan);
  tombolAtas.classList.toggle('pointer-events-none', !tampilkan);

  // Tandai menu sesuai bagian yang sedang dilihat
  linkNav.forEach(function (link) {
    const bagian = document.querySelector(link.getAttribute('href'));
    const kotak = bagian.getBoundingClientRect();
    const sedangDilihat = kotak.top < window.innerHeight * 0.4 && kotak.bottom > window.innerHeight * 0.4;
    link.classList.toggle('aktif', sedangDilihat);
  });

  nyalakanManifesto();
  isiGarisApi();
}
window.addEventListener('scroll', saatScroll, { passive: true });


/* ---------------------------------------------------------
   3. MENU HP
   --------------------------------------------------------- */
const tombolMenu = document.getElementById('tombol-menu');
const menuHp = document.getElementById('menu-hp');
const garisMenu = document.querySelectorAll('.garis-menu');
let menuTerbuka = false;

function aturMenu(buka) {
  menuTerbuka = buka;
  menuHp.classList.toggle('opacity-0', !buka);
  menuHp.classList.toggle('pointer-events-none', !buka);
  // Ikon garis tiga berubah jadi tanda X
  garisMenu[0].style.transform = buka ? 'translateY(8px) rotate(45deg)' : '';
  garisMenu[1].style.opacity = buka ? '0' : '1';
  garisMenu[2].style.transform = buka ? 'translateY(-8px) rotate(-45deg)' : '';
}
tombolMenu.addEventListener('click', function () { aturMenu(!menuTerbuka); });
document.querySelectorAll('.link-hp').forEach(function (link) {
  link.addEventListener('click', function () { aturMenu(false); });
});


/* ---------------------------------------------------------
   4. BARA API BETERBANGAN DI HERO (canvas)
   --------------------------------------------------------- */
const kanvas = document.getElementById('kanvas-bara');
const ctx = kanvas.getContext('2d');
let partikel = [];
let mouse = { x: -999, y: -999 };
let heroTerlihat = true;

function ukuranKanvas() {
  kanvas.width = kanvas.offsetWidth;
  kanvas.height = kanvas.offsetHeight;
  // HP dapat partikel lebih sedikit supaya tetap ringan
  const jumlah = window.innerWidth < 768 ? 110 : 260;
  partikel = [];
  for (let i = 0; i < jumlah; i++) partikel.push(buatPartikel(true));
}

function buatPartikel(acak) {
  return {
    x: Math.random() * kanvas.width,
    y: acak ? Math.random() * kanvas.height : kanvas.height + 10,
    r: Math.random() * 2.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -(Math.random() * 1.2 + 0.4),
    hidup: Math.random() * 0.5 + 0.5,
    goyang: Math.random() * Math.PI * 2
  };
}

function gambarBara() {
  if (heroTerlihat) {
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.globalCompositeOperation = 'lighter';

    partikel.forEach(function (p, i) {
      p.goyang += 0.03;
      p.x += p.vx + Math.sin(p.goyang) * 0.4;
      p.y += p.vy;
      p.hidup -= 0.0025;

      // Bara menjauh dari kursor
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const jarak = Math.sqrt(dx * dx + dy * dy);
      if (jarak < 120) {
        p.x += dx / jarak * 2;
        p.y += dy / jarak * 2;
      }

      // Ganti dengan bara baru kalau sudah padam / keluar layar
      if (p.hidup <= 0 || p.y < -10) partikel[i] = buatPartikel(false);

      const cahaya = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      cahaya.addColorStop(0, 'rgba(255, 220, 150,' + p.hidup + ')');
      cahaya.addColorStop(0.4, 'rgba(255, 77, 26,' + p.hidup * 0.8 + ')');
      cahaya.addColorStop(1, 'rgba(185, 28, 28, 0)');
      ctx.fillStyle = cahaya;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  requestAnimationFrame(gambarBara);
}

kanvas.parentElement.addEventListener('mousemove', function (e) {
  const kotak = kanvas.getBoundingClientRect();
  mouse.x = e.clientX - kotak.left;
  mouse.y = e.clientY - kotak.top;
});
kanvas.parentElement.addEventListener('mouseleave', function () { mouse = { x: -999, y: -999 }; });

// Hentikan animasi saat hero tidak terlihat (hemat baterai)
new IntersectionObserver(function (entri) {
  heroTerlihat = entri[0].isIntersecting;
}).observe(kanvas);

if (!kurangiGerak) {
  ukuranKanvas();
  gambarBara();
  window.addEventListener('resize', ukuranKanvas);
}


/* ---------------------------------------------------------
   4b. API KEBAKARAN
   Memakai algoritma "Doom fire": layar dibagi jadi kotak kecil.
   Baris paling bawah adalah sumber api; panasnya merambat ke atas
   sambil berkurang sedikit demi sedikit dan bergeser acak ke kiri/kanan,
   sehingga terbentuk lidah api yang menari.
   --------------------------------------------------------- */
// 37 warna: dari hitam → merah → oranye → kuning → putih
const paletApi = [
  [7,7,7],[31,7,7],[47,15,7],[71,15,7],[87,23,7],[103,31,7],[119,31,7],[143,39,7],
  [159,47,7],[175,63,7],[191,71,7],[199,71,7],[223,79,7],[223,87,7],[223,87,7],[215,95,7],
  [215,95,7],[215,103,15],[207,111,15],[207,119,15],[207,127,15],[207,135,23],[199,135,23],
  [199,143,23],[199,151,31],[191,159,31],[191,159,31],[191,167,39],[191,167,39],[191,175,47],
  [183,175,47],[183,183,47],[183,183,55],[207,207,111],[223,223,159],[239,239,199],[255,255,255]
];
const PANAS_MAKS = paletApi.length - 1;

function nyalakanApi(kanvasApi) {
  const ctxApi = kanvasApi.getContext('2d');
  const kecil = document.createElement('canvas'); // kanvas kecil, nanti diperbesar
  const ctxKecil = kecil.getContext('2d');
  const tinggiApi = parseFloat(kanvasApi.dataset.tinggi) || 0.8;
  let lebar, tinggi, panas, gambar, redup;
  let kekuatan = 0;      // api menyala perlahan dari 0 sampai PANAS_MAKS
  let terlihat = false;

  function siapkan() {
    const ukuranKotak = window.innerWidth < 768 ? 5 : 7;
    kanvasApi.width = kanvasApi.offsetWidth;
    kanvasApi.height = kanvasApi.offsetHeight;
    lebar = Math.ceil(kanvasApi.width / ukuranKotak);
    tinggi = Math.ceil(kanvasApi.height / ukuranKotak);
    kecil.width = lebar;
    kecil.height = tinggi;
    panas = new Uint8Array(lebar * tinggi);
    gambar = ctxKecil.createImageData(lebar, tinggi);
    // Atur seberapa cepat api padam supaya tingginya pas dengan kanvas
    redup = Math.max(0, PANAS_MAKS / (tinggi * tinggiApi) - 1 / 3);
  }

  function rambatkan() {
    // Sumber api di baris paling bawah. Titik panasnya bergeser pelan
    // (pakai gelombang sinus) supaya terbentuk lidah-lidah api, bukan dinding rata.
    const dasar = (tinggi - 1) * lebar;
    const t = performance.now() / 700;
    for (let x = 0; x < lebar; x++) {
      const gelombang = 0.65 + 0.35 * Math.sin(x * 0.11 + t) * Math.sin(x * 0.031 - t * 0.6);
      const nilai = kekuatan * batasi(gelombang + (Math.random() - 0.5) * 0.25, 0, 1);
      panas[dasar + x] = nilai;
      if (dasar - lebar + x >= 0) panas[dasar - lebar + x] = nilai; // dua baris supaya dasar api tebal
    }
    // Panas merambat ke atas
    for (let y = 1; y < tinggi - 1; y++) {
      for (let x = 0; x < lebar; x++) {
        const asal = y * lebar + x;
        const nilai = panas[asal];
        if (nilai === 0) {
          panas[asal - lebar] = 0;
          continue;
        }
        const acak = Math.floor(Math.random() * 3);              // 0, 1, atau 2
        const tujuan = asal - lebar - acak + 1;                   // geser kiri/tengah/kanan
        const turun = (acak & 1) + (Math.random() < redup ? 1 : 0);
        if (tujuan >= 0) panas[tujuan] = Math.max(0, nilai - turun);
      }
    }
  }

  function gambarApi() {
    if (terlihat) {
      kekuatan = Math.min(PANAS_MAKS, kekuatan + 0.3);
      rambatkan();

      const d = gambar.data;
      for (let i = 0; i < panas.length; i++) {
        const warna = paletApi[panas[i]];
        const j = i * 4;
        d[j] = warna[0];
        d[j + 1] = warna[1];
        d[j + 2] = warna[2];
        d[j + 3] = panas[i] === 0 ? 0 : Math.min(255, panas[i] * panas[i] * 0.9); // ujung api = transparan
      }
      ctxKecil.putImageData(gambar, 0, 0);

      ctxApi.clearRect(0, 0, kanvasApi.width, kanvasApi.height);
      ctxApi.imageSmoothingEnabled = true;
      ctxApi.drawImage(kecil, 0, 0, kanvasApi.width, kanvasApi.height);
    }
    requestAnimationFrame(gambarApi);
  }

  // Hanya dihitung saat terlihat di layar (hemat baterai)
  new IntersectionObserver(function (entri) {
    terlihat = entri[0].isIntersecting;
  }).observe(kanvasApi);

  siapkan();
  window.addEventListener('resize', siapkan);
  gambarApi();
}

if (!kurangiGerak) {
  document.querySelectorAll('.kanvas-api').forEach(nyalakanApi);
}


/* ---------------------------------------------------------
   5. EFEK MENGETIK DI HERO
   --------------------------------------------------------- */
const elKetik = document.getElementById('ketik');
const kalimat = [
  'upeti di istana raja...',
  'pembukuan palsu VOC...',
  'persen dari tanam paksa...',
  'amplop di bawah meja...',
  'hingga transfer satu klik.'
];
let iKalimat = 0;
let iHuruf = 0;
let menghapus = false;

function mulaiMengetik() {
  const teks = kalimat[iKalimat];
  elKetik.textContent = teks.substring(0, iHuruf);

  if (!menghapus && iHuruf < teks.length) {
    iHuruf++;
    setTimeout(mulaiMengetik, 70);
  } else if (!menghapus) {
    menghapus = true;
    setTimeout(mulaiMengetik, 1800); // jeda sebelum dihapus
  } else if (iHuruf > 0) {
    iHuruf--;
    setTimeout(mulaiMengetik, 30);
  } else {
    menghapus = false;
    iKalimat = (iKalimat + 1) % kalimat.length;
    setTimeout(mulaiMengetik, 300);
  }
}


/* ---------------------------------------------------------
   6. ELEMEN MUNCUL SAAT DI-SCROLL
   --------------------------------------------------------- */
const pengamat = new IntersectionObserver(function (entri) {
  entri.forEach(function (e) {
    if (e.isIntersecting) {
      e.target.classList.add('tampil');
      pengamat.unobserve(e.target); // cukup sekali
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(function (el) { pengamat.observe(el); });


/* ---------------------------------------------------------
   7. MANIFESTO: KATA MENYALA SATU PER SATU
   --------------------------------------------------------- */
const teksManifesto = document.getElementById('teks-manifesto');
const semuaKata = [];

// Pecah paragraf menjadi <span> per kata. Kata di dalam <b> diberi warna api.
Array.from(teksManifesto.childNodes).forEach(function (node) {
  const panas = node.nodeName === 'B';
  node.textContent.split(/(\s+)/).forEach(function (potongan) {
    if (potongan.trim() === '') {
      semuaKata.push(document.createTextNode(potongan));
    } else {
      const span = document.createElement('span');
      span.className = 'kata' + (panas ? ' panas' : '');
      span.textContent = potongan;
      semuaKata.push(span);
    }
  });
});
teksManifesto.innerHTML = '';
semuaKata.forEach(function (k) { teksManifesto.appendChild(k); });
const spanKata = teksManifesto.querySelectorAll('.kata');

function nyalakanManifesto() {
  const kotak = teksManifesto.getBoundingClientRect();
  const mulai = window.innerHeight * 0.85;
  const akhir = window.innerHeight * 0.35;
  // progres 0 → 1 selama paragraf melewati layar
  const progres = batasi((mulai - kotak.top) / (mulai - akhir + kotak.height * 0.6), 0, 1);
  const jumlahNyala = Math.floor(progres * spanKata.length);
  spanKata.forEach(function (span, i) { span.classList.toggle('nyala', i < jumlahNyala); });
}


/* ---------------------------------------------------------
   8. LINIMASA: GARIS API TERISI SAAT SCROLL
   --------------------------------------------------------- */
const wadahLinimasa = document.getElementById('wadah-linimasa');
const garisApi = document.getElementById('garis-api');
const titikEra = document.querySelectorAll('.titik-era');

function isiGarisApi() {
  const kotak = wadahLinimasa.getBoundingClientRect();
  const titikBaca = window.innerHeight * 0.6;
  const progres = batasi((titikBaca - kotak.top) / kotak.height, 0, 1);
  garisApi.style.height = (progres * 100) + '%';

  titikEra.forEach(function (titik) {
    titik.classList.toggle('aktif', titik.getBoundingClientRect().top < titikBaca);
  });
}

// Teks RAHASIA dibuka saat diklik
document.querySelectorAll('.sensor').forEach(function (el) {
  el.addEventListener('click', function () {
    el.classList.toggle('terbuka');
  });
});


/* ---------------------------------------------------------
   9. PENGHITUNG ANGKA
   --------------------------------------------------------- */
function hitungNaik(el) {
  const target = parseFloat(el.dataset.target);
  const desimal = el.dataset.desimal ? 1 : 0;
  const durasi = 2000;
  const waktuMulai = performance.now();

  function langkah(sekarang) {
    const t = batasi((sekarang - waktuMulai) / durasi, 0, 1);
    const halus = 1 - Math.pow(1 - t, 4); // melambat di akhir
    const nilai = target * halus;

    if (el.dataset.tanpaTitik) {
      el.textContent = Math.floor(nilai);
    } else {
      el.textContent = nilai.toLocaleString('id-ID', { minimumFractionDigits: desimal, maximumFractionDigits: desimal });
    }
    if (t < 1) requestAnimationFrame(langkah);
  }
  requestAnimationFrame(langkah);
}

const pengamatAngka = new IntersectionObserver(function (entri) {
  entri.forEach(function (e) {
    if (e.isIntersecting) {
      hitungNaik(e.target);
      pengamatAngka.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('.hitung').forEach(function (el) { pengamatAngka.observe(el); });

// Kartu angka sedikit miring mengikuti kursor (efek 3D)
document.querySelectorAll('.kartu-miring').forEach(function (kartu) {
  kartu.addEventListener('mousemove', function (e) {
    const kotak = kartu.getBoundingClientRect();
    const x = (e.clientX - kotak.left) / kotak.width - 0.5;
    const y = (e.clientY - kotak.top) / kotak.height - 0.5;
    kartu.style.transform = 'perspective(600px) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 14) + 'deg) scale(1.03)';
  });
  kartu.addEventListener('mouseleave', function () { kartu.style.transform = ''; });
});


/* ---------------------------------------------------------
   10. GRAFIK IPK (Indeks Persepsi Korupsi)
   Sumber: Transparency International
   --------------------------------------------------------- */
const dataIpk = [
  { tahun: 2014, skor: 34 }, { tahun: 2015, skor: 36 }, { tahun: 2016, skor: 37 },
  { tahun: 2017, skor: 37 }, { tahun: 2018, skor: 38 }, { tahun: 2019, skor: 40 },
  { tahun: 2020, skor: 37 }, { tahun: 2021, skor: 38 }, { tahun: 2022, skor: 34 },
  { tahun: 2023, skor: 34 }, { tahun: 2024, skor: 37 }
];
const grafik = document.getElementById('grafik-ipk');
const labelTahun = document.getElementById('label-tahun');
const infoBatang = document.getElementById('info-batang');

dataIpk.forEach(function (d) {
  const batang = document.createElement('div');
  batang.className = 'batang relative flex-1 rounded-t-md bg-gradient-to-t from-darah to-bara hover:to-emas cursor-pointer transition-colors';
  batang.dataset.tinggi = (d.skor / 50 * 100) + '%'; // garis atas grafik = skor 50
  batang.innerHTML = '<span class="label-nilai absolute -top-6 inset-x-0 text-center text-xs font-bold text-emas">' + d.skor + '</span>';

  batang.addEventListener('mouseenter', function () {
    infoBatang.textContent = 'Tahun ' + d.tahun + ': skor ' + d.skor + ' dari 100';
  });
  grafik.appendChild(batang);

  const label = document.createElement('span');
  label.className = 'flex-1 text-center';
  label.textContent = "'" + String(d.tahun).slice(2);
  labelTahun.appendChild(label);
});

new IntersectionObserver(function (entri, obs) {
  if (entri[0].isIntersecting) {
    grafik.classList.add('tampil');
    grafik.querySelectorAll('.batang').forEach(function (b, i) {
      b.style.transitionDelay = (i * 0.08) + 's';
      b.style.height = b.dataset.tinggi;
    });
    obs.disconnect();
  }
}, { threshold: 0.4 }).observe(grafik);


/* ---------------------------------------------------------
   11. KARTU BALIK — bisa diketuk di HP
   --------------------------------------------------------- */
document.querySelectorAll('.flip').forEach(function (kartu) {
  kartu.addEventListener('click', function () { kartu.classList.toggle('dibalik'); });
});


/* ---------------------------------------------------------
   12. KALKULATOR KEHILANGAN
   --------------------------------------------------------- */
const slider = document.getElementById('slider');
const nilaiSlider = document.getElementById('nilai-slider');
const tombolKasus = document.querySelectorAll('.tombol-kasus');

// Asumsi biaya (rupiah) — sama dengan catatan di halaman
const biaya = {
  guru: 24000000,           // Rp 2 juta x 12 bulan
  kelas: 300000000,         // 1 ruang kelas
  puskesmas: 10000000000,   // 1 puskesmas
  makan: 15000,             // 1 porsi makan bergizi
  beasiswa: 60000000        // kuliah sampai lulus
};
const nilaiSebelumnya = {};

// Ubah angka besar jadi singkat, contoh 12.500.000 → "12,5 juta"
function singkat(angka) {
  const opsi = { maximumFractionDigits: 1 };
  if (angka >= 1e12) return (angka / 1e12).toLocaleString('id-ID', opsi) + ' triliun';
  if (angka >= 1e9)  return (angka / 1e9).toLocaleString('id-ID', opsi) + ' miliar';
  if (angka >= 1e6)  return (angka / 1e6).toLocaleString('id-ID', opsi) + ' juta';
  return Math.floor(angka).toLocaleString('id-ID');
}

// Angka hasil bergerak halus dari nilai lama ke nilai baru
function animasiAngka(id, target) {
  const el = document.getElementById(id);
  const awal = nilaiSebelumnya[id] || 0;
  const waktuMulai = performance.now();
  nilaiSebelumnya[id] = target;

  function langkah(sekarang) {
    const t = batasi((sekarang - waktuMulai) / 600, 0, 1);
    const halus = 1 - Math.pow(1 - t, 3);
    el.textContent = singkat(awal + (target - awal) * halus);
    if (t < 1 && nilaiSebelumnya[id] === target) requestAnimationFrame(langkah);
  }
  requestAnimationFrame(langkah);
}

function hitungKalkulator() {
  const triliun = parseFloat(slider.value);
  const rupiah = triliun * 1e12;
  nilaiSlider.textContent = triliun.toLocaleString('id-ID', { maximumFractionDigits: 1 });

  animasiAngka('hasil-guru', rupiah / biaya.guru);
  animasiAngka('hasil-kelas', rupiah / biaya.kelas);
  animasiAngka('hasil-puskesmas', rupiah / biaya.puskesmas);
  animasiAngka('hasil-makan', rupiah / biaya.makan);
  animasiAngka('hasil-beasiswa', rupiah / biaya.beasiswa);

  // Tandai tombol kasus yang cocok dengan nilai slider
  tombolKasus.forEach(function (t) {
    const cocok = parseFloat(t.dataset.nilai) === triliun;
    t.classList.toggle('bg-bara', cocok);
    t.classList.toggle('text-abu', cocok);
    t.classList.toggle('border-bara', cocok);
  });
}

slider.addEventListener('input', hitungKalkulator);
tombolKasus.forEach(function (t) {
  t.addEventListener('click', function () {
    slider.value = t.dataset.nilai;
    hitungKalkulator();
  });
});
hitungKalkulator();


/* ---------------------------------------------------------
   13. MOCKUP HP: NOTIFIKASI & STEMPEL
   --------------------------------------------------------- */
const hp = document.getElementById('hp');
new IntersectionObserver(function (entri, obs) {
  if (!entri[0].isIntersecting) return;
  obs.disconnect();

  const notif = hp.querySelectorAll('.notif');
  notif.forEach(function (n, i) {
    setTimeout(function () { n.classList.add('tampil'); }, 500 + i * 700);
  });
  setTimeout(function () {
    document.getElementById('stempel').classList.add('jatuh');
    hp.classList.add('goyang');
  }, 500 + notif.length * 700 + 300);
}, { threshold: 0.5 }).observe(hp);


/* ---------------------------------------------------------
   14. KUIS: KORUPSI ATAU BUKAN?
   --------------------------------------------------------- */
const soalKuis = [
  {
    teks: 'Memberi “uang rokok” Rp 50 ribu ke petugas supaya KTP-mu cepat jadi.',
    korupsi: true,
    alasan: 'Itu suap atau pungli. Kecil atau besar, membeli layanan publik yang seharusnya sesuai prosedur tetap korupsi.'
  },
  {
    teks: 'Kepala dinas meloloskan keponakannya menjadi pegawai tanpa ikut seleksi.',
    korupsi: true,
    alasan: 'Ini nepotisme — huruf “N” dalam KKN. Orang lain yang lebih layak kehilangan kesempatannya.'
  },
  {
    teks: 'Pejabat melaporkan seluruh hartanya dengan jujur ke LHKPN.',
    korupsi: false,
    alasan: 'Justru itu kewajiban dan bentuk keterbukaan. Inilah budaya yang seharusnya diwariskan.'
  },
  {
    teks: 'Panitia lelang menerima transfer “hadiah ulang tahun” dari vendor yang sedang ikut tender.',
    korupsi: true,
    alasan: 'Gratifikasi yang berhubungan dengan jabatan dianggap suap bila tidak dilaporkan ke KPK dalam 30 hari kerja.'
  },
  {
    teks: 'Menandatangani daftar hadir rapat yang tidak pernah diadakan supaya dapat honor.',
    korupsi: true,
    alasan: 'Kegiatan fiktif untuk mencairkan anggaran adalah korupsi yang merugikan keuangan negara.'
  },
  {
    teks: 'Menolak tawaran “jalur belakang” dan tetap mengantre sesuai prosedur.',
    korupsi: false,
    alasan: 'Tindakan kecil seperti ini yang memutus rantai warisan korupsi. 🔥'
  }
];

const kotakKuis = document.getElementById('kotak-kuis');
let nomorSoal = 0;
let skor = 0;

function tampilkanSoal() {
  const soal = soalKuis[nomorSoal];
  const progres = (nomorSoal / soalKuis.length) * 100;

  kotakKuis.innerHTML =
    '<div class="flex justify-between text-sm text-kertas/50 mb-3">' +
      '<span>Soal ' + (nomorSoal + 1) + ' / ' + soalKuis.length + '</span>' +
      '<span>Skor: <b class="text-emas">' + skor + '</b></span>' +
    '</div>' +
    '<div class="h-1.5 bg-debu rounded-full overflow-hidden mb-8">' +
      '<div class="h-full bg-gradient-to-r from-emas to-bara transition-all duration-700" style="width:' + progres + '%"></div>' +
    '</div>' +
    '<p class="font-judul text-2xl md:text-4xl uppercase leading-tight mb-8">' + soal.teks + '</p>' +
    '<div class="grid sm:grid-cols-2 gap-3">' +
      '<button class="opsi-kuis text-left border-2 border-debu rounded-2xl p-5 font-bold" data-jawab="true">🔥 Korupsi</button>' +
      '<button class="opsi-kuis text-left border-2 border-debu rounded-2xl p-5 font-bold" data-jawab="false">✋ Bukan korupsi</button>' +
    '</div>' +
    '<div id="penjelasan" class="hidden mt-6"></div>';

  kotakKuis.querySelectorAll('.opsi-kuis').forEach(function (tombol) {
    tombol.addEventListener('click', function () { jawab(tombol, soal); });
  });
}

function jawab(tombol, soal) {
  const pilihanKorupsi = tombol.dataset.jawab === 'true';
  const benar = pilihanKorupsi === soal.korupsi;

  // Kunci semua tombol
  kotakKuis.querySelectorAll('.opsi-kuis').forEach(function (t) {
    t.disabled = true;
    t.classList.add('opacity-50');
  });
  tombol.classList.remove('opacity-50');

  if (benar) {
    skor++;
    tombol.classList.add('border-emas', 'bg-bara/20');
    const kotak = tombol.getBoundingClientRect();
    semburPercikan(kotak.left + kotak.width / 2, kotak.top + kotak.height / 2, 25);
  } else {
    tombol.classList.add('border-darah', 'bg-darah/20', 'goyang');
  }

  const penjelasan = document.getElementById('penjelasan');
  penjelasan.innerHTML =
    '<div class="border-l-4 ' + (benar ? 'border-emas' : 'border-darah') + ' bg-arang rounded-r-xl p-5">' +
      '<p class="font-bold ' + (benar ? 'text-emas' : 'text-red-400') + '">' + (benar ? 'Tepat!' : 'Kurang tepat.') + '</p>' +
      '<p class="text-kertas/70 mt-1">' + soal.alasan + '</p>' +
    '</div>' +
    '<button id="tombol-lanjut" class="mt-5 bg-bara text-abu font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-emas transition-colors">' +
      (nomorSoal < soalKuis.length - 1 ? 'Lanjut →' : 'Lihat hasil →') +
    '</button>';
  penjelasan.classList.remove('hidden');

  document.getElementById('tombol-lanjut').addEventListener('click', function () {
    nomorSoal++;
    if (nomorSoal < soalKuis.length) tampilkanSoal();
    else tampilkanHasil();
  });
}

function tampilkanHasil() {
  let judul, pesan;
  if (skor === soalKuis.length) {
    judul = 'Mata Elang 🦅';
    pesan = 'Kamu tidak tertipu kata “biasa”. Sekarang tularkan kepekaan ini ke sekitarmu.';
  } else if (skor >= 4) {
    judul = 'Cukup Peka 🔥';
    pesan = 'Hampir sempurna. Ingat: korupsi sering bersembunyi di balik kata “terima kasih”.';
  } else {
    judul = 'Waspada ⚠️';
    pesan = 'Mungkin kita sudah terlalu terbiasa dengan yang “wajar”. Justru di situlah warisan ini bertahan.';
  }

  kotakKuis.innerHTML =
    '<div class="text-center py-6">' +
      '<p class="font-ketik text-bara tracking-widest text-sm">HASILMU</p>' +
      '<p class="font-judul text-8xl md:text-9xl teks-api my-4">' + skor + '/' + soalKuis.length + '</p>' +
      '<p class="font-judul text-3xl uppercase">' + judul + '</p>' +
      '<p class="text-kertas/70 mt-3 max-w-md mx-auto">' + pesan + '</p>' +
      '<button id="ulang-kuis" class="mt-8 border-2 border-bara text-bara font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-bara hover:text-abu transition-colors">↺ Ulangi kuis</button>' +
    '</div>';

  const kotak = kotakKuis.getBoundingClientRect();
  semburPercikan(kotak.left + kotak.width / 2, kotak.top + kotak.height / 3, 50);

  document.getElementById('ulang-kuis').addEventListener('click', function () {
    nomorSoal = 0;
    skor = 0;
    tampilkanSoal();
  });
}

tampilkanSoal();


/* ---------------------------------------------------------
   15. SEMBURAN PERCIKAN API
   --------------------------------------------------------- */
function semburPercikan(x, y, jumlah) {
  if (kurangiGerak) return;
  for (let i = 0; i < jumlah; i++) {
    const p = document.createElement('div');
    p.className = 'percikan';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    document.body.appendChild(p);

    const sudut = Math.random() * Math.PI * 2;
    const jarak = Math.random() * 160 + 60;
    const animasi = p.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(' + (Math.cos(sudut) * jarak) + 'px, ' + (Math.sin(sudut) * jarak - 60) + 'px) scale(0)', opacity: 0 }
    ], { duration: 800 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
    animasi.onfinish = function () { p.remove(); };
  }
}


/* ---------------------------------------------------------
   16. IKRAR
   --------------------------------------------------------- */
const formIkrar = document.getElementById('form-ikrar');
formIkrar.addEventListener('submit', function (e) {
  e.preventDefault(); // jangan muat ulang halaman

  const nama = document.getElementById('nama-ikrar').value.trim();
  document.getElementById('nama-di-kartu').textContent = nama || 'Warga Indonesia';
  document.getElementById('tanggal-ikrar').textContent =
    'Ditandatangani ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const kartu = document.getElementById('kartu-ikrar');
  kartu.classList.remove('hidden');
  kartu.animate([
    { opacity: 0, transform: 'translateY(40px) rotate(6deg) scale(.8)' },
    { opacity: 1, transform: 'translateY(0) rotate(-2deg) scale(1)' }
  ], { duration: 700, easing: 'cubic-bezier(.3,1.5,.5,1)' });

  const tombol = document.getElementById('tombol-ikrar');
  tombol.textContent = 'Ikrar Tercatat ✓';
  tombol.classList.remove('denyut');
  const kotak = tombol.getBoundingClientRect();
  semburPercikan(kotak.left + kotak.width / 2, kotak.top + kotak.height / 2, 60);
});


/* ---------------------------------------------------------
   17. CAHAYA MENGIKUTI KURSOR (desktop)
   --------------------------------------------------------- */
const cahayaKursor = document.getElementById('cahaya-kursor');
let tujuanX = 0, tujuanY = 0, posX = 0, posY = 0;

window.addEventListener('mousemove', function (e) {
  tujuanX = e.clientX;
  tujuanY = e.clientY;
});

function gerakCahaya() {
  // Bergerak pelan menyusul kursor supaya terasa halus
  posX += (tujuanX - posX) * 0.12;
  posY += (tujuanY - posY) * 0.12;
  cahayaKursor.style.left = posX + 'px';
  cahayaKursor.style.top = posY + 'px';
  requestAnimationFrame(gerakCahaya);
}
if (!kurangiGerak) gerakCahaya();

// Jalankan sekali di awal supaya posisi awal benar
saatScroll();


/* ---------------------------------------------------------
   18. GALERI SATIR: topeng bisa diketuk & poster diperbesar
   --------------------------------------------------------- */
// Di HP tidak ada hover, jadi topeng dibuka/tutup dengan ketukan
const satirTopeng = document.getElementById('satir-topeng');
satirTopeng.addEventListener('click', function () {
  satirTopeng.classList.toggle('buka');
});

const lightbox = document.getElementById('lightbox');
function aturLightbox(buka) {
  lightbox.classList.toggle('hidden', !buka);
  lightbox.classList.toggle('flex', buka);
  document.documentElement.style.overflow = buka ? 'hidden' : '';
  if (buka) {
    lightbox.querySelector('img').animate(
      [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 400, easing: 'cubic-bezier(.3,1.4,.5,1)' }
    );
  }
}
document.getElementById('buka-poster').addEventListener('click', function () { aturLightbox(true); });
lightbox.addEventListener('click', function () { aturLightbox(false); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') aturLightbox(false);
});


/* ---------------------------------------------------------
   19. MUSIK LATAR (Feast — Peradaban)
   Lagu dicoba diputar otomatis saat loading selesai (lihat cobaMasuk di bagian 1).
   Kalau browser memblokir, lagu menyala lewat tombol "Buka Arsip" di layar pembuka,
   klik pertama di halaman, atau tombol musik di pojok kiri bawah.
   --------------------------------------------------------- */
const musik = document.getElementById('musik');
const tombolMusik = document.getElementById('tombol-musik');
const statusMusik = document.getElementById('status-musik');
const VOLUME_MAKS = 0.6;
let pernahDiputar = false;

// Mengembalikan Promise: true kalau lagu berhasil diputar, false kalau diblokir browser
function putarMusik() {
  if (!pernahDiputar) musik.volume = 0;
  return musik.play().then(function () {
    pernahDiputar = true;
    tombolMusik.classList.add('main');
    statusMusik.textContent = 'Sedang diputar';
    // Volume naik pelan-pelan (fade in) supaya tidak mengagetkan
    const naik = setInterval(function () {
      musik.volume = Math.min(VOLUME_MAKS, musik.volume + 0.03);
      if (musik.volume >= VOLUME_MAKS) clearInterval(naik);
    }, 80);
    return true;
  }).catch(function () {
    return false; // diblokir browser
  });
}

function jedaMusik() {
  musik.pause();
  tombolMusik.classList.remove('main');
  statusMusik.textContent = 'Dijeda';
}

tombolMusik.addEventListener('click', function (e) {
  e.stopPropagation(); // jangan ikut memicu "klik pertama" di bawah
  if (musik.paused) putarMusik();
  else jedaMusik();
});

function mulaiSaatInteraksi() {
  if (!pernahDiputar) putarMusik();
}
document.addEventListener('click', mulaiSaatInteraksi, { once: true });
document.addEventListener('keydown', mulaiSaatInteraksi, { once: true });
