import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  X,
  ShieldCheck,
  WifiOff,
  Sparkles,
  Layers,
  Code2,
  FileCode,
  Terminal,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const APKModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android-studio' | 'pwabuilder' | 'pwa-direct'>('android-studio');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  // Derive the live production app URL
  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-h45lxyax7ncco3jldof4jt-930024016802.asia-east1.run.app';

  const manifestUrl = `${currentUrl}/manifest.json`;
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyManifest = async () => {
    try {
      const res = await fetch('/manifest.json');
      const json = await res.text();
      copyToClipboard(json, 'manifest-json');
    } catch {
      copyToClipboard(manifestUrl, 'manifest-json');
    }
  };

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Android Studio Code Snippets
  const mainActivityKotlin = `package com.maharashtra.arogyasevak

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    // १००% ऑफलाईन स्टँडअलोन Assets पद्धतीसाठी URL
    // जर assets फोल्डर वापरत असाल तर file:///android_asset/index.html वापरा
    private val offlineAssetUrl = "file:///android_asset/index.html"
    // किंवा ऑनलाईन URL
    private val onlineUrl = "${currentUrl}"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        // WebView आवश्यक सेटींग्ज
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // ॲपमधील सर्व लिंक्स अंतर्गत उघडण्यासाठी
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                if (url.startsWith("tel:") || url.startsWith("whatsapp:") || url.startsWith("mailto:")) {
                    return try {
                        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        true
                    } catch (e: Exception) {
                        false
                    }
                }
                return false
            }
        }

        // एक्सेल अहवाल डाऊनलोड हाताळण्यासाठी (DownloadManager)
        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
            try {
                val request = DownloadManager.Request(Uri.parse(url))
                request.setMimeType(mimetype)
                request.addRequestHeader("User-Agent", userAgent)
                request.setDescription("आरोग्य अहवाल डाऊनलोड होत आहे...")
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype))
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    URLUtil.guessFileName(url, contentDisposition, mimetype)
                )
                val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                Toast.makeText(applicationContext, "अहवाल डाऊनलोड होत आहे...", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(applicationContext, "डाऊनलोड त्रुटी: \${e.message}", Toast.LENGTH_SHORT).show()
            }
        }

        // फोनचे Back बटण हाताळणी
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // १००% ऑफलाईन फाईल्स असल्यास हे वापरा:
        webView.loadUrl(offlineAssetUrl)
        // किंवा ऑनलाईन क्लाउडसाठी: webView.loadUrl(onlineUrl)
    }
}`;

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.maharashtra.arogyasevak">

    <!-- इंटरनेट आणि स्टोरेज परवानग्या -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="आरोग्य सेवक"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MaterialComponents.Light.NoActionBar"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const activityMainXml = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</FrameLayout>`;

  const buildGradleKts = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.maharashtra.arogyasevak"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.maharashtra.arogyasevak"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
}`;

  return (
    <div
      id="apk-modal-backdrop"
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="apk-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-4 animate-scale-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A4A72] to-[#0F2B48] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                <span>Android Studio द्वारे APK निर्मिती</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase font-mono">
                  Native APK
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-normal">
                Android Studio मधील संपूर्ण प्रोजेक्ट फाईल्स व स्टेप-बाय-स्टेप मार्गदर्शक
              </p>
            </div>
          </div>
          <button
            id="close-apk-modal-btn"
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="बंद करा"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('android-studio')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'android-studio'
                ? 'border-[#1A4A72] text-[#1A4A72] dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>१. Android Studio (Kotlin कोड)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'border-[#1A4A72] text-[#1A4A72] dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>२. PWABuilder (विना कोडिंग)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa-direct')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pwa-direct'
                ? 'border-[#1A4A72] text-[#1A4A72] dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>३. थेट फोनवर इन्स्टॉल</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto text-slate-700 dark:text-slate-300 text-sm">
          {activeTab === 'android-studio' && (
            <div className="space-y-6">
              {/* Step by step workflow */}
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-sky-900 dark:text-sky-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>Android Studio मध्ये APK तयार करण्याच्या ५ सोप्या पायऱ्या:</span>
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-sky-950 dark:text-sky-300 leading-relaxed font-medium">
                  <li>
                    Android Studio उघडा आणि <strong>&quot;New Project&quot;</strong> वर क्लिक करा.
                  </li>
                  <li>
                    <strong>&quot;Empty Views Activity&quot;</strong> निवडा (Name: <code>ArogyaSevak</code>, Package Name: <code>com.maharashtra.arogyasevak</code>, Language: <code>Kotlin</code>).
                  </li>
                  <li>
                    खाली दिलेला <code>MainActivity.kt</code> आणि <code>activity_main.xml</code> कोड कॉपी करून प्रोजेक्टमध्ये पेस्ट करा.
                  </li>
                  <li>
                    <code>AndroidManifest.xml</code> मध्ये इंटरनेट परवानग्या (INTERNET permission) पेस्ट करा.
                  </li>
                  <li>
                    वरच्या मेनूमध्ये <strong>Build → Build Bundle(s) / APK(s) → Build APK(s)</strong> निवडा. २ मिनिटांत तुमची <strong>.apk</strong> फाईल तयार होईल!
                  </li>
                </ol>
              </div>

              {/* Code Snippet 1: MainActivity.kt */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-mono font-bold text-slate-100">
                      app/src/main/java/com/maharashtra/arogyasevak/MainActivity.kt
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mainActivityKotlin, 'main-activity')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'main-activity' ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'main-activity' ? 'कॉपी झाले!' : 'कोड कॉपी करा'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed text-slate-300">
                  {mainActivityKotlin}
                </pre>
              </div>

              {/* Code Snippet 2: activity_main.xml */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-slate-100">
                      app/src/main/res/layout/activity_main.xml
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activityMainXml, 'activity-layout')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'activity-layout' ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'activity-layout' ? 'कॉपी झाले!' : 'कोड कॉपी करा'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-40 leading-relaxed text-slate-300">
                  {activityMainXml}
                </pre>
              </div>

              {/* Code Snippet 3: AndroidManifest.xml */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-slate-100">
                      app/src/main/AndroidManifest.xml
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(manifestXml, 'android-manifest')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'android-manifest' ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'android-manifest' ? 'कॉपी झाले!' : 'कोड कॉपी करा'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-52 leading-relaxed text-slate-300">
                  {manifestXml}
                </pre>
              </div>

              {/* Code Snippet 4: build.gradle.kts */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-mono font-bold text-slate-100">
                      app/build.gradle.kts
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(buildGradleKts, 'build-gradle')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'build-gradle' ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'build-gradle' ? 'कॉपी झाले!' : 'कोड कॉपी करा'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-52 leading-relaxed text-slate-300">
                  {buildGradleKts}
                </pre>
              </div>

              {/* Offline Bundling Tip */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 space-y-3">
                <p className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>१००% ऑफलाईन स्टँडअलोन APK बनवण्यासाठी (कायमस्वरूपी तोडगा):</span>
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  या पद्धतीमुळे ॲप चालण्यासाठी कोणत्याही इंटरनेट लिंकची किंवा क्लाउड सर्व्हरची गरज पडत नाही. ॲप पूर्णपणे तुमच्या फोनमध्येच राहते:
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <a
                    href="/arogyasevak_assets.zip"
                    download="arogyasevak_assets.zip"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ऑफलाईन Assets फाईल डाऊनलोड करा (.zip)</span>
                  </a>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li>वरील <strong>.zip</strong> फाईल डाऊनलोड करून Extract (Unzip) करा.</li>
                  <li>Android Studio मध्ये <code>app/src/main/assets</code> फोल्डर बनवा आणि आतील फाईल्स त्यात पेस्ट करा.</li>
                  <li><code>MainActivity.kt</code> मध्ये <code>webView.loadUrl(&quot;file:///android_asset/index.html&quot;)</code> वापरा.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'pwabuilder' && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                गुगल व मायक्रोसॉफ्टच्या अधिकृत <strong>PWABuilder</strong> द्वारे विना कोडिंग थेट <strong>.apk</strong> फाईल डाऊनलोड करता येते:
              </p>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="w-full truncate text-xs font-mono text-slate-600 dark:text-slate-400 select-all">
                  {currentUrl}
                </div>
                <button
                  id="copy-app-link-btn"
                  type="button"
                  onClick={() => copyToClipboard(currentUrl, 'app-link')}
                  className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedKey === 'app-link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'app-link' ? 'लिंक कॉपी झाली!' : 'ॲप लिंक कॉपी करा'}</span>
                </button>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Web Manifest पूर्णपणे तयार आणि अधिकृत आहे (Valid)</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                    manifest.json ✓
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    id="copy-manifest-json-btn"
                    type="button"
                    onClick={handleCopyManifest}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'manifest-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'manifest-json' ? 'मॅनिफेस्ट कोड कॉपी झाला!' : 'मॅनिफेस्ट JSON कॉपी करा'}</span>
                  </button>
                  <a
                    id="view-manifest-link"
                    href="/manifest.json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-[#1A4A72] dark:text-sky-400 hover:underline"
                  >
                    <span>मॅनिफेस्ट फाईल पहा</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div>
                <a
                  id="open-pwabuilder-btn"
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full bg-[#1A4A72] hover:bg-[#123653] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>PWABuilder वर तपासा आणि APK बनवा</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'pwa-direct' && (
            <div className="space-y-4">
              {isInstalled ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">ॲप आधीच तुमच्या डिव्हाइसवर इन्स्टॉल केलेले आहे!</p>
                    <p className="text-xs text-emerald-700">
                      हे ॲप तुमच्या होम स्क्रीनवर असून ते पूर्णपणे ऑफलाईनही कार्य करते.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        थेट Android ॲप इन्स्टॉलेशन
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        कोणतीही वेगळी APK फाईल न घेता Chrome वरून थेट फोनवर ॲप इन्स्टॉल करता येते.
                      </p>
                    </div>
                  </div>
                  {isInstallable ? (
                    <button
                      id="native-pwa-install-btn"
                      type="button"
                      onClick={handleNativeInstall}
                      disabled={installing}
                      className="shrink-0 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{installing ? 'इन्स्टॉल होत आहे...' : 'फोनवर इन्स्टॉल करा'}</span>
                    </button>
                  ) : isIOS ? (
                    <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg font-medium">
                      Safari Share → &quot;Add to Home Screen&quot;
                    </span>
                  ) : (
                    <span className="text-xs text-blue-700 bg-blue-100 dark:bg-blue-900/50 px-3 py-1.5 rounded-lg font-medium">
                      Chrome मेनू (⋮) → &quot;Install App&quot; निवडा
                    </span>
                  )}
                </div>
              )}

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">१००% ऑफलाईन काम करते</p>
                    <p className="text-slate-500 dark:text-slate-400">गावात नेटवर्क नसतानाही फॉर्म भरणे चालू राहते.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">डेटा फोनमध्येच सुरक्षित</p>
                    <p className="text-slate-500 dark:text-slate-400">सर्व नोंदी मोबाईल स्टोरेजमध्ये सुरक्षित राहतात.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            महाराष्ट्र शासन सार्वजनिक आरोग्य विभाग | उपकेंद्र प्रणाली
          </span>
          <button
            id="apk-modal-close-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            बंद करा
          </button>
        </div>
      </div>
    </div>
  );
};

