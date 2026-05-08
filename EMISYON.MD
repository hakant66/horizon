# EMİSYON HESAPLAMA KILAVUZU
## Horizon Sürdürülebilirlik Platformu — Seragazı Emisyonu Metodolojisi

> **Uyarı:** Bu belgede yer alan tüm emisyon katsayıları **demo/placeholder** değerlerdir.  
> Gerçek raporlama süreçlerinde TEİAŞ, EPDK, DEFRA, IEA ve IPCC gibi resmi kaynaklardan  
> doğrulanmış güncel katsayılar kullanılmalıdır.

---

## İçindekiler

1. [Temel Hesaplama Formülü](#1-temel-hesaplama-formülü)
2. [Kapsam 1 — Doğrudan Emisyonlar](#2-kapsam-1--doğrudan-emisyonlar)
3. [Kapsam 2 — Satın Alınan Enerji Kaynaklı Emisyonlar](#3-kapsam-2--satın-alınan-enerji-kaynaklı-emisyonlar)
4. [Kapsam 3 — Değer Zinciri Dolaylı Emisyonlar](#4-kapsam-3--değer-zinciri-dolaylı-emisyonlar)
5. [Sistemde Kullanılan Katsayılar](#5-sistemde-kullanılan-katsayılar)
6. [Standart Referansları](#6-standart-referansları)
7. [Veri Kalitesi ve Belirsizlik](#7-veri-kalitesi-ve-belirsizlik)

---

## 1. Temel Hesaplama Formülü

Tüm kapsamlardaki emisyonlar aynı temel formüle dayanır:

```
Emisyon (tCO₂e) = Faaliyet Değeri × Emisyon Katsayısı ÷ 1.000
```

| Terim | Tanım | Örnek Birim |
|---|---|---|
| **Faaliyet Değeri** | Ölçülen tüketim veya aktivite miktarı | kWh, litre, km, kg, ton-km |
| **Emisyon Katsayısı** | Birim aktivite başına kgCO₂e | kgCO₂e/kWh, kgCO₂e/L |
| **÷ 1.000** | kgCO₂e → tCO₂e dönüşümü | — |
| **tCO₂e** | Ton karbondioksit eşdeğeri | CO₂, CH₄, N₂O, F-gazları dahil |

**CO₂e (Karbondioksit Eşdeğeri):** Farklı seragazlarının (CH₄, N₂O, HFC vb.) iklim ısıtma potansiyelleri,  
100 yıllık GWP (Global Warming Potential) değerleri kullanılarak CO₂ cinsinden ifade edilir.  
(IPCC AR6 GWP100: CH₄ = 27,9 · CO₂, N₂O = 273 · CO₂)

---

## 2. Kapsam 1 — Doğrudan Emisyonlar

### Tanım
Şirketin **sahip olduğu veya doğrudan kontrol ettiği** kaynaklardan atmosfere salınan seragazlarıdır.

### Kaynaklar
- Şirkete ait araçların yaktığı yakıt (dizel, benzin/petrol, LPG)
- Tesislerdeki doğalgaz kazanları, fırınlar, ısıtma sistemleri
- Soğutma sistemlerindeki F-gazı kaçakları (soğutucu gaz)
- Endüstriyel kimyasal süreç emisyonları

### Formül

```
Kapsam 1 Emisyonu (tCO₂e) = Σ [Yakıt_i (birim) × Katsayı_i (kgCO₂e/birim)] ÷ 1.000
```

### Hesaplama Örnekleri

#### Örnek A — Dizel Araç Filosu
```
Faaliyet : 5.000 litre dizel
Katsayı  : 2,68 kgCO₂e/L   (DEFRA 2024)
Formül   : 5.000 × 2,68 / 1.000
Sonuç    : 13,40 tCO₂e
```

#### Örnek B — Doğalgaz Kazanı
```
Faaliyet : 2.000 m³ doğalgaz
Katsayı  : 1,90 kgCO₂e/m³  (IPCC 2006)
Formül   : 2.000 × 1,90 / 1.000
Sonuç    : 3,80 tCO₂e
```

#### Örnek C — LPG (Likit Petrol Gazı)
```
Faaliyet : 800 litre LPG
Katsayı  : 1,63 kgCO₂e/L
Formül   : 800 × 1,63 / 1.000
Sonuç    : 1,30 tCO₂e
```

### Kapsam 1 Standardı
- **GHG Protokolü:** Corporate Standard (2004), Bölüm 5
- **IFRS S2:** Paragraf 40(a)(i) — Gross Scope 1 GHG Emissions
- **TSRS 2:** Madde 40(a)(i)
- **ESRS E1-6:** AR 25 — Doğrudan (Kapsam 1) GHG Emisyonları

---

## 3. Kapsam 2 — Satın Alınan Enerji Kaynaklı Emisyonlar

### Tanım
Şirketin dışarıdan satın aldığı **elektrik, ısı, soğutma veya buhar**ın üretimi sırasında oluşan  
ve şirketin talebi nedeniyle gerçekleşen dolaylı seragazı emisyonlarıdır.  
Şirket binasında fiziksel bir baca olmaz; emisyonlar elektrik santralinde veya enerji üretim tesisinde oluşur.

### İki Yöntem

| Yöntem | Tanım | Kullanım |
|---|---|---|
| **Konum Bazlı (Location-Based)** | Ulusal şebeke ortalama emisyon faktörü kullanılır | Temel zorunlu yöntem |
| **Piyasa Bazlı (Market-Based)** | Sözleşmeli/sertifikalı yenilenebilir enerji faktörü kullanılır | Yenilenebilir enerji alımı varsa |

### Formül

```
Kapsam 2 Emisyonu (tCO₂e) = Satın Alınan Enerji (kWh) × Şebeke Faktörü (kgCO₂e/kWh) ÷ 1.000
```

### Hesaplama Örnekleri

#### Örnek A — Tesis Elektrik Tüketimi (Konum Bazlı)
```
Faaliyet : 50.000 kWh elektrik (Türkiye şebekesinden)
Katsayı  : 0,43 kgCO₂e/kWh   (TEİAŞ 2024 — demo değer)
Formül   : 50.000 × 0,43 / 1.000
Sonuç    : 21,50 tCO₂e
```

#### Örnek B — Merkezi Isıtma / Buhar
```
Faaliyet : 8.000 kWh ısı/buhar
Katsayı  : 0,18 kgCO₂e/kWh   (IEA 2024 — demo değer)
Formül   : 8.000 × 0,18 / 1.000
Sonuç    : 1,44 tCO₂e
```

#### Örnek C — Yenilenebilir Enerji Sertifikası (Piyasa Bazlı)
```
Faaliyet : 50.000 kWh (onaylı rüzgar enerjisi sertifikası)
Katsayı  : 0,00 kgCO₂e/kWh   (onaylı RES — sıfır faktör)
Formül   : 50.000 × 0,00 / 1.000
Sonuç    : 0,00 tCO₂e
```

### Kapsam 2 Standardı
- **GHG Protokolü:** Scope 2 Guidance (2015) — Konum ve Piyasa Bazlı
- **IFRS S2:** Paragraf 40(a)(ii)
- **TSRS 2:** Madde 40(a)(ii)
- **ESRS E1-6:** AR 25 — Enerji Endirekt (Kapsam 2) GHG Emisyonları

---

## 4. Kapsam 3 — Değer Zinciri Dolaylı Emisyonlar

### Tanım
Şirketin faaliyetleriyle bağlantılı ancak doğrudan kontrolü dışındaki  
**tüm diğer dolaylı** seragazı emisyonlarıdır.  
GHG Protokolü bu emisyonları **15 kategoriye** ayırır.

### Temel Formül (Tüm Kategoriler İçin)

```
Kapsam 3 Emisyonu (tCO₂e) = Faaliyet Değeri × Katsayı (kgCO₂e/birim) ÷ 1.000
```

---

### Kategori 1 — Satın Alınan Mal ve Hizmetler

Tedarik zincirinden satın alınan tüm mallar ve hizmetlerin üretiminde ortaya çıkan emisyonlar.

**Yöntem:** Harcama Bazlı (Spend-Based)

```
Emisyon (tCO₂e) = Harcama (kUSD) × Sektörel Yoğunluk Katsayısı (kgCO₂e/kUSD) ÷ 1.000
```

```
Örnek  : 200 kUSD tedarikçi harcaması
Katsayı: 500 kgCO₂e/kUSD (USEEIO v2 ortalama — demo)
Formül : 200 × 500 / 1.000
Sonuç  : 100 tCO₂e
```

> **Not:** Hassas sonuç için tedarikçi bazlı (supplier-specific) ya da  
> hibrit yöntem (fiziksel miktar × ürüne özgü katsayı) kullanılmalıdır.

---

### Kategori 3 — Yakıt ve Enerji ile İlgili Faaliyetler

Kapsam 1 ve 2'ye dahil edilmeyen yakıt/enerji upstream emisyonları:  
elektrik iletim-dağıtım (T&D) kayıpları, yakıt çıkarma ve rafineride oluşan emisyonlar.

```
Emisyon (tCO₂e) = Satın Alınan Elektrik (kWh) × T&D Kayıp Katsayısı ÷ 1.000
```

```
Örnek  : 50.000 kWh elektrik
Katsayı: 0,04 kgCO₂e/kWh (IEA T&D kayıp faktörü — demo)
Formül : 50.000 × 0,04 / 1.000
Sonuç  : 2,00 tCO₂e
```

---

### Kategori 4 — Upstream Taşımacılık ve Dağıtım

Hammadde ve ürünlerin tedarikçiden şirkete taşınması sırasındaki emisyonlar.

```
Emisyon (tCO₂e) = Ağırlık (ton) × Mesafe (km) × Taşıma Katsayısı (kgCO₂e/ton-km) ÷ 1.000
```

```
Örnek  : 10 ton yük × 500 km (karayolu TIR)
Katsayı: 0,062 kgCO₂e/ton-km (GLEC 2023 — demo)
Formül : 5.000 ton-km × 0,062 / 1.000
Sonuç  : 0,31 tCO₂e
```

| Taşıma Modu | Katsayı (kgCO₂e/ton-km) | Kaynak |
|---|---|---|
| Karayolu (TIR) | 0,062 | GLEC 2023 |
| Demiryolu | 0,028 | GLEC 2023 |
| Denizyolu (konteyner) | 0,016 | GLEC 2023 |
| Hava kargo | 0,602 | GLEC 2023 |

---

### Kategori 5 — Operasyonlarda Oluşan Atık

Şirketin faaliyetlerinden kaynaklanan ve bertaraf edilen atıkların emisyonları.

```
Emisyon (tCO₂e) = Atık Miktarı (kg) × Bertaraf Katsayısı (kgCO₂e/kg) ÷ 1.000
```

```
Örnek A — Düzenli depolama (landfill):
Miktar  : 2.000 kg karışık belediye atığı
Katsayı : 0,58 kgCO₂e/kg (IPCC 2006 — demo)
Formül  : 2.000 × 0,58 / 1.000
Sonuç   : 1,16 tCO₂e

Örnek B — Yakma (incineration):
Miktar  : 500 kg plastik atık
Katsayı : 0,32 kgCO₂e/kg (IPCC 2006 — demo)
Formül  : 500 × 0,32 / 1.000
Sonuç   : 0,16 tCO₂e
```

---

### Kategori 6 — İş Seyahati

Çalışanların iş amacıyla yaptığı uçuş, tren ve araç seyahatlerinden kaynaklanan emisyonlar.

```
Emisyon (tCO₂e) = Mesafe (km) × Ulaşım Katsayısı (kgCO₂e/km) ÷ 1.000
```

```
Örnek A — Kısa Mesafe Uçuş (< 3.700 km, ekonomi):
Mesafe  : 2.000 km
Katsayı : 0,255 kgCO₂e/km (DEFRA 2024 — demo, RF faktörü dahil)
Formül  : 2.000 × 0,255 / 1.000
Sonuç   : 0,51 tCO₂e

Örnek B — Uzun Mesafe Uçuş (≥ 3.700 km, ekonomi):
Mesafe  : 8.000 km
Katsayı : 0,195 kgCO₂e/km (DEFRA 2024 — demo)
Formül  : 8.000 × 0,195 / 1.000
Sonuç   : 1,56 tCO₂e

Örnek C — Tren:
Mesafe  : 500 km
Katsayı : 0,041 kgCO₂e/km (IEA Rail — demo)
Sonuç   : 0,021 tCO₂e
```

| Ulaşım Modu | Katsayı (kgCO₂e/km) | Sınıf/Açıklama | Kaynak |
|---|---|---|---|
| Kısa mesafe uçuş | 0,255 | Ekonomi, RF dahil | DEFRA 2024 |
| Uzun mesafe uçuş | 0,195 | Ekonomi, RF dahil | DEFRA 2024 |
| Tren | 0,041 | Ortalama | IEA 2024 |
| Araç (ortalama) | 0,171 | Benzin/dizel ortalama | DEFRA 2024 |

> **RF (Radyatif Zorlama):** Yüksek irtifada uçuş, ozon ve kondansasyon izleri  
> nedeniyle ek iklim etkisi yaratır. DEFRA katsayıları RF faktörünü içermektedir.

---

### Kategori 7 — Çalışan Ulaşımı (Commuting)

Çalışanların ev-işyeri arası günlük yolculuklarından kaynaklanan emisyonlar.

```
Emisyon (tCO₂e) = Çalışan Yolculuk Mesafesi (km/yıl) × Mod Katsayısı ÷ 1.000
```

```
Örnek — Araçla Ulaşım:
Yıllık mesafe : 100 çalışan × 30 km/gün × 220 iş günü = 660.000 km
Katsayı      : 0,171 kgCO₂e/km
Formül       : 660.000 × 0,171 / 1.000
Sonuç        : 112,86 tCO₂e

Örnek — Toplu Taşıma:
Yıllık mesafe : 50 çalışan × 20 km/gün × 220 gün = 220.000 km
Katsayı      : 0,089 kgCO₂e/km
Sonuç        : 19,58 tCO₂e
```

---

### Kategori 9 — Downstream Taşımacılık ve Dağıtım

Şirketten müşteriye ürün/hizmet ulaşımı sırasındaki emisyonlar.

```
Emisyon (tCO₂e) = Ton-km × Katsayı (kgCO₂e/ton-km) ÷ 1.000
```

```
Örnek  : 50 ton ürün × 300 km karayolu
Ton-km : 15.000 ton-km
Katsayı: 0,062 kgCO₂e/ton-km
Sonuç  : 0,93 tCO₂e
```

---

### Kategori 11 — Satılan Ürünlerin Kullanımı

Müşterilerin satın aldığı ürünleri kullanırken (enerji tüketerek) oluşan emisyonlar.

```
Emisyon (tCO₂e) = Yıllık Enerji Tüketimi (kWh/ürün) × Satılan Ürün Adedi × Ömür (yıl) × Şebeke Faktörü ÷ 1.000
```

```
Örnek — Elektrikli cihaz:
Ürün tüketimi: 200 kWh/yıl
Satış adedi  : 1.000 adet
Ürün ömrü   : 5 yıl
Şebeke       : 0,43 kgCO₂e/kWh
Formül       : 200 × 1.000 × 5 × 0,43 / 1.000
Sonuç        : 430 tCO₂e (toplam ürün ömrü boyunca)
```

---

## 5. Sistemde Kullanılan Katsayılar

| Kapsam | Metrik Kodu | Kategori | Katsayı | Birim | Kaynak (Demo) |
|---|---|---|---|---|---|
| Kapsam 1 | `natural_gas_consumption` | Doğalgaz | 1,90 | kgCO₂e/m³ | IPCC 2006 |
| Kapsam 1 | `diesel_consumption` | Dizel | 2,68 | kgCO₂e/L | DEFRA 2024 |
| Kapsam 1 | `petrol_consumption` | Benzin | 2,31 | kgCO₂e/L | DEFRA 2024 |
| Kapsam 1 | `lpg_consumption` | LPG | 1,63 | kgCO₂e/L | IPCC 2006 |
| Kapsam 1 | `fuel_oil_consumption` | Fuel-Oil | 3,17 | kgCO₂e/L | IPCC 2006 |
| Kapsam 2 | `electricity_consumption` | Elektrik (Türkiye) | 0,43 | kgCO₂e/kWh | TEİAŞ 2024 |
| Kapsam 2 | `district_heat_consumption` | Merkezi Isıtma | 0,18 | kgCO₂e/kWh | IEA 2024 |
| Kapsam 3 Kat.1 | `s3_purchased_goods_spend` | Satın Alınan Mallar | 500 | kgCO₂e/kUSD | USEEIO v2 |
| Kapsam 3 Kat.3 | `s3_fuel_energy_related` | T&D Kayıpları | 0,04 | kgCO₂e/kWh | IEA |
| Kapsam 3 Kat.4 | `s3_upstream_logistics_tkm` | Upstream Lojistik | 0,062 | kgCO₂e/ton-km | GLEC 2023 |
| Kapsam 3 Kat.5 | `s3_waste_to_landfill` | Depolama | 0,58 | kgCO₂e/kg | IPCC 2006 |
| Kapsam 3 Kat.5 | `s3_waste_incinerated` | Yakma | 0,32 | kgCO₂e/kg | IPCC 2006 |
| Kapsam 3 Kat.6 | `s3_business_travel_air_short` | Kısa Uçuş | 0,255 | kgCO₂e/km | DEFRA 2024 |
| Kapsam 3 Kat.6 | `s3_business_travel_air_long` | Uzun Uçuş | 0,195 | kgCO₂e/km | DEFRA 2024 |
| Kapsam 3 Kat.6 | `s3_business_travel_rail` | Tren | 0,041 | kgCO₂e/km | IEA 2024 |
| Kapsam 3 Kat.6 | `s3_business_travel_car` | Araç | 0,171 | kgCO₂e/km | DEFRA 2024 |
| Kapsam 3 Kat.7 | `s3_employee_commute_car` | Araçla İşe Gidiş | 0,171 | kgCO₂e/km | DEFRA 2024 |
| Kapsam 3 Kat.7 | `s3_employee_commute_transit` | Toplu Taşımayla İşe Gidiş | 0,089 | kgCO₂e/km | IEA |
| Kapsam 3 Kat.9 | `s3_downstream_logistics_tkm` | Downstream Lojistik | 0,062 | kgCO₂e/ton-km | GLEC 2023 |
| Kapsam 3 Kat.11 | `s3_product_energy_use_kwh` | Ürün Kullanımı | 0,43 | kgCO₂e/kWh | TEİAŞ 2024 |

---

## 6. Standart Referansları

| Standart | Kapsam Gereksinimleri |
|---|---|
| **GHG Protokolü Corporate Standard (2004)** | Kapsam 1 ve 2 zorunlu; Kapsam 3 isteğe bağlı |
| **GHG Protokolü Kapsam 3 Standardı (2011)** | 15 kategori tanımlar; ilgili kategoriler raporlanmalı |
| **IFRS S2 (2023)** | Kapsam 1, 2 zorunlu; Kapsam 3 (Para. 40(a)(iii)) — finansal açıdan önemli ise zorunlu |
| **TSRS 2 (Türkiye)** | IFRS S2 ile uyumlu — Kapsam 1, 2 zorunlu |
| **ESRS E1-6 (CSRD)** | Kapsam 1, 2, 3 toplamı ve kategoriler zorunlu (büyük şirketler için) |
| **CDP İklim** | Kapsam 1, 2 zorunlu; Kapsam 3 — en az 10 kategori teşvik edilir |
| **TCFD** | Kapsam 1, 2 zorunlu; Kapsam 3 — ilgili ise açıklanmalı |

---

## 7. Veri Kalitesi ve Belirsizlik

### Veri Kalitesi Hiyerarşisi (GHG Protokolü)

```
1. Birincil Veri (en iyi)    — Tedarikçiden doğrudan ölçüm/beyan
2. Sektöre Özgü Katsayı      — Endüstri ortalaması katsayıları
3. Harcama Bazlı Katsayı     — USEEIO, EXIOBASE I-O tabloları
4. Genel Ortalama (en kötü)  — Küresel ortalama katsayılar
```

### Önemli Notlar

- **Yenilenebilir Enerji:** Şirket onaylı yenilenebilir enerji satın alıyorsa  
  Kapsam 2 **piyasa bazlı** yöntemde 0 kgCO₂e/kWh kullanılabilir,  
  ancak **konum bazlı** sonuç da ayrıca raporlanmalıdır (IFRS S2 Para. 40(a)(ii)).

- **Çift Sayım:** Kapsam 2 elektrik, Kapsam 3 Kategori 3'te de upstream kayıp  
  olarak kısmen yer alır. Bu kasıtlı bir çift sayım değil, metodolojik gerekliliktir.

- **Birim Dönüşümleri:**
  - Doğalgaz: 1 m³ ≈ 10,55 kWh (alt ısıl değer, Türkiye)
  - LPG: 1 kg ≈ 1,96 L (sıvı yoğunluk)
  - Dizel: 1 L ≈ 0,835 kg

- **Yıllık Güncelleme:** Türkiye elektrik şebeke faktörü (0,43 kgCO₂e/kWh)  
  TEİAŞ tarafından yıllık olarak güncellenir. Her raporlama yılı için  
  ilgili yılın resmi faktörü kullanılmalıdır.

---

*Bu belge Horizon Sürdürülebilirlik Platformu kapsamında hazırlanmıştır.*  
*Son güncelleme: Mayıs 2026*
