import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput,
  type TextProps,
  View,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { adminEmail, isSupabaseConfigured, supabase } from './lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Pattern = {
  id: string;
  name: string;
  category: string;
  stitches: string;
  size: string;
  objectPath?: string;
  imagePath?: string;
  imageUrl?: string;
  art: string;
  color: string;
};

const getPatternImagePath = (objectPath: string) => {
  const match = /^(.*\/)(\d+)-with-image-/.exec(objectPath);
  return match ? `${match[1]}${match[2]}-image` : undefined;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
};

const categories = ['All', 'Floral', 'Animals', 'Lettering', 'Geometric'];
type Language = 'en' | 'ar';
const LanguageContext = createContext<Language>('en');
const languageStorageKey = '@rachmati/language';
const arabicTranslations: Record<string, string> = {
  'A little thread goes a long way': 'بعض الخيوط تصنع فرقاً كبيراً',
  'OWNER ONLY': 'للمالك فقط',
  'Welcome to Rachmati': 'مرحباً بك في رحمتي',
  'Sign in or create an account': 'سجّل الدخول أو أنشئ حساباً',
  'Sign in with your Google account to browse embroidery designs.': 'سجّل الدخول باستخدام حساب Google لاستكشاف تصاميم التطريز.',
  'Login with Google': 'تسجيل الدخول باستخدام Google',
  'Sign up with Google': 'إنشاء حساب باستخدام Google',
  'Signing in with Google…': 'جارٍ تسجيل الدخول باستخدام Google…',
  'Creating your account…': 'جارٍ إنشاء حسابك…',
  'Preparing your account…': 'جارٍ تجهيز حسابك…',
  'Connect Supabase to enable customer sign-in.': 'اربط Supabase لتفعيل تسجيل دخول العملاء.',
  'New customers are registered automatically when they continue with Google.': 'يُسجّل العملاء الجدد تلقائياً عند المتابعة باستخدام Google.',
  'Google sign-in failed. Please try again.': 'تعذّر تسجيل الدخول باستخدام Google. حاول مرة أخرى.',
  'Google sign-in did not return an authorization code.': 'لم يُرجع تسجيل الدخول باستخدام Google رمز التفويض.',
  'Could not restore the customer session.': 'تعذّرت استعادة جلسة العميل.',
  'Manage patterns': 'إدارة التصاميم',
  'Sign in to publish and manage your .DST designs.': 'سجّل الدخول لنشر تصاميم DST وإدارتها.',
  'Connect your private cloud': 'اربط التخزين السحابي الخاص بك',
  'Add your Supabase project URL, publishable key, and owner email to the local .env file, then restart Expo. The setup steps and security policies are in supabase/setup.sql.':
    'أضف رابط مشروع Supabase والمفتاح العام وبريد المالك إلى ملف .env المحلي، ثم أعد تشغيل Expo. ستجد خطوات الإعداد وسياسات الأمان في supabase/setup.sql.',
  'This account is not the owner': 'هذا الحساب ليس حساب المالك',
  'Sign in with the owner email configured for this app.': 'سجّل الدخول باستخدام بريد المالك المُعدّ لهذا التطبيق.',
  'Sign out': 'تسجيل الخروج',
  'Owner email': 'بريد المالك الإلكتروني',
  'Password': 'كلمة المرور',
  'Signing in…': 'جارٍ تسجيل الدخول…',
  'Sign in as owner': 'تسجيل الدخول كمالك',
  'Signed in as {email}': 'تم تسجيل الدخول باسم {email}',
  'Design name': 'اسم التصميم',
  'Category': 'الفئة',
  'Stitch count (for example 8,200)': 'عدد الغرز (مثال: ٨٬٢٠٠)',
  'Hoop size (for example 4 × 4 in)': 'مقاس إطار التطريز (مثال: ٤ × ٤ بوصة)',
  'Choose .DST file (max 25 MB)': 'اختر ملف DST (بحد أقصى ٢٥ ميغابايت)',
  'Please wait…': 'يرجى الانتظار…',
  'Upload and publish pattern': 'رفع التصميم ونشره',
  'Published designs': 'التصاميم المنشورة',
  'Delete': 'حذف',
  'Cancel': 'إلغاء',
  'Delete pattern?': 'هل تريد حذف التصميم؟',
  'Remove "{name}" from the catalog?': 'هل تريد إزالة "{name}" من الكتالوج؟',
  'Return to pattern catalog': 'العودة إلى كتالوج التصاميم',
  'Owner sign in': 'تسجيل دخول المالك',
  'YOUR CREATIVE CORNER': 'ركنك الإبداعي',
  'Find your next\nfavorite stitch.': 'اكتشف تصميمك\nالمفضل القادم.',
  'Explore embroidery designs made for your machine.': 'اكتشف تصاميم تطريز مناسبة لآلتك.',
  'Curated by Rachmati': 'مختارة بعناية من رحمتي',
  'Thoughtfully selected designs for your next project': 'تصاميم مختارة بعناية لمشروعك القادم',
  'ADVERTISEMENT': 'إعلان',
  'A little space for something lovely': 'مساحة صغيرة لشيء جميل',
  'Ad partner can be connected before launch': 'يمكن ربط شريك إعلاني قبل الإطلاق',
  'Search embroidery patterns': 'ابحث عن تصاميم تطريز',
  'Clear search': 'مسح البحث',
  'Explore': 'استكشف',
  'Saved': 'المحفوظات',
  'All': 'الكل',
  'Floral': 'زهور',
  'Animals': 'حيوانات',
  'Lettering': 'كتابة',
  'Geometric': 'هندسي',
  'Saved designs': 'التصاميم المحفوظة',
  'Made for your hoop': 'مصممة لإطارك',
  'Your bookmarked sample patterns': 'التصاميم التي أضفتها إلى المحفوظات',
  'Available designs for your catalog': 'التصاميم المتاحة في كتالوجك',
  '{count} designs': '{count} تصاميم',
  'No designs have been published yet.': 'لم يتم نشر أي تصاميم بعد.',
  'No saved designs yet': 'لا توجد تصاميم محفوظة بعد',
  'No patterns found': 'لم يتم العثور على تصاميم',
  'Tap the heart on a design to keep it close.': 'اضغط على القلب لحفظ التصميم.',
  'Try another search or category.': 'جرّب البحث أو الفئة مرة أخرى.',
  '{count} stitches': '{count} غرزة',
  'Remove {name} from saved': 'إزالة {name} من المحفوظات',
  'Save {name}': 'حفظ {name}',
  'Save {name} DST file to your device': 'حفظ ملف DST للتصميم {name} على جهازك',
  'Made with care, one stitch at a time.': 'صُنع بعناية، غرزة تلو الأخرى.',
  'Choose a language': 'اختر اللغة',
  'Could not save your language preference.': 'تعذّر حفظ إعداد اللغة.',
  'Could not restore the admin session.': 'تعذّرت استعادة جلسة المالك.',
  'Could not load the pattern catalog.': 'تعذّر تحميل كتالوج التصاميم.',
  'Could not find an available filename in the selected folder.': 'تعذّر العثور على اسم ملف متاح في المجلد المحدد.',
  'Download complete': 'اكتمل التنزيل',
  '{file} was saved to {folder}.': 'تم حفظ {file} في {folder}.',
  'Sign in failed. Please try again.': 'تعذّر تسجيل الدخول. حاول مرة أخرى.',
  'Sign out failed. Please try again.': 'تعذّر تسجيل الخروج. حاول مرة أخرى.',
  'Could not open the file picker.': 'تعذّر فتح مستعرض الملفات.',
  'Enter the design details and choose a .DST file.': 'أدخل تفاصيل التصميم واختر ملف DST.',
  'Files must be 25 MB or smaller.': 'يجب ألا يتجاوز حجم الملف ٢٥ ميغابايت.',
  'The pattern could not be uploaded.': 'تعذّر رفع التصميم.',
  'The pattern could not be deleted.': 'تعذّر حذف التصميم.',
  'DST file selected': 'تم اختيار ملف DST',
  'Choose design image': 'اختر صورة التصميم',
  'Image selected': 'تم اختيار الصورة',
  'Choose both a .DST file and a design image.': 'اختر ملف DST وصورة التصميم.',
  'Images must be 10 MB or smaller.': 'يجب ألا يتجاوز حجم الصورة ١٠ ميغابايت.',
  'The design image could not be uploaded.': 'تعذّر رفع صورة التصميم.',
  'Choose an image file.': 'اختر ملف صورة.',
  'Uploaded files could not be cleaned up': 'تعذّر حذف الملفات التي تم رفعها',
  'Design image for {name}': 'صورة التصميم {name}',
  'Close image preview': 'إغلاق معاينة الصورة',
};
const categoryDetails: Record<string, { art: string; color: string }> = {
  Floral: { art: '🌼', color: '#F6E8CB' },
  Animals: { art: '🐻', color: '#E4E9D8' },
  Lettering: { art: '🌱', color: '#EADFED' },
  Geometric: { art: '🌈', color: '#F2DFD4' },
};

const getDisplayFileName = (file: File) => (
  file.name.toLowerCase().endsWith('.dst') ? file.name : 'DST file selected'
);

function Text(props: TextProps) {
  const language = useContext(LanguageContext);
  const existingTextAlign = StyleSheet.flatten(props.style)?.textAlign;
  return (
    <NativeText
      {...props}
      style={[
        props.style,
        language === 'ar' && {
          writingDirection: 'rtl',
          textAlign: existingTextAlign ?? 'right',
        },
      ]}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StitchStudioScreen />
    </SafeAreaProvider>
  );
}

function StitchStudioScreen() {
  const [language, setLanguage] = useState<Language>('en');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [saved, setSaved] = useState<string[]>([]);
  const [tab, setTab] = useState<'Explore' | 'Saved'>('Explore');
  const [showAdmin, setShowAdmin] = useState(false);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(!isSupabaseConfigured);
  const [adminEmailInput, setAdminEmailInput] = useState(adminEmail);
  const [password, setPassword] = useState('');
  const [patternName, setPatternName] = useState('');
  const [patternCategory, setPatternCategory] = useState('Floral');
  const [stitches, setStitches] = useState('');
  const [hoopSize, setHoopSize] = useState('');
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedImage, setPickedImage] = useState<File | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [customerAuthError, setCustomerAuthError] = useState<string | null>(null);
  const [customerAuthAction, setCustomerAuthAction] = useState<'signIn' | 'signUp' | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [downloadingPatternId, setDownloadingPatternId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [previewPattern, setPreviewPattern] = useState<Pattern | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const isArabic = language === 'ar';
  const t = (value: string) => isArabic ? (arabicTranslations[value] ?? value) : value;
  const isOwner = Boolean(adminEmail && session?.user.email?.trim().toLowerCase() === adminEmail);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(languageStorageKey)
      .then((savedLanguage) => {
        if (active && (savedLanguage === 'en' || savedLanguage === 'ar')) {
          setLanguage(savedLanguage);
        }
      })
      .catch(() => {
        if (active) setLanguageError('Could not save your language preference.');
      });
    return () => { active = false; };
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setLanguageError(null);
    void AsyncStorage.setItem(languageStorageKey, nextLanguage).catch(() => {
      setLanguageError('Could not save your language preference.');
    });
  };

  useEffect(() => {
    const client = supabase;
    if (!client) return undefined;
    let active = true;
    void (async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (!active) return;
        if (error) setCustomerAuthError(error.message);
        setSession(data.session);
        setSessionReady(true);
      } catch (error) {
        if (active) {
          setCustomerAuthError(error instanceof Error ? error.message : 'Could not restore the customer session.');
          setSessionReady(true);
        }
      }
    })();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !session) return undefined;
    let active = true;
    void (async () => {
      try {
        const { data, error } = await client
          .from('patterns')
          .select('id, name, category, stitches, hoop_size, art, color, object_path')
          .order('created_at', { ascending: false });
        if (!active) return;
        if (error) {
          setCatalogError(error.message);
          return;
        }
        setPatterns((data ?? []).map((pattern) => {
          const imagePath = getPatternImagePath(pattern.object_path);
          return {
            id: pattern.id,
            name: pattern.name,
            category: pattern.category,
            stitches: pattern.stitches,
            size: pattern.hoop_size,
            objectPath: pattern.object_path,
            imagePath,
            imageUrl: imagePath
              ? client.storage.from('patterns').getPublicUrl(imagePath).data.publicUrl
              : undefined,
            art: pattern.art,
            color: pattern.color,
          };
        }));
        setCatalogError(null);
      } catch (error) {
        if (active) setCatalogError(error instanceof Error ? error.message : 'Could not load the pattern catalog.');
      }
    })();
    return () => { active = false; };
  }, [session]);

  const visiblePatterns = useMemo(() => patterns.filter((pattern) => {
    const matchesCategory = category === 'All' || pattern.category === category;
    const matchesQuery = pattern.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesTab = tab !== 'Saved' || saved.includes(pattern.id);
    return matchesCategory && matchesQuery && matchesTab;
  }), [category, patterns, query, saved, tab]);

  const toggleSaved = (id: string) => {
    setSaved((current) => current.includes(id)
      ? current.filter((savedId) => savedId !== id)
      : [...current, id]);
  };

  const downloadPattern = async (pattern: Pattern) => {
    const client = supabase;
    if (!client || !pattern.objectPath) return;

    setDownloadingPatternId(pattern.id);
    setDownloadError(null);
    try {
      const { data: { publicUrl } } = client.storage.from('patterns').getPublicUrl(pattern.objectPath);
      const storedFileName = pattern.objectPath.split('/').pop() || `pattern-${pattern.id}.dst`;
      const fileName = storedFileName.replace(/^\d+-with-image-/, '');

      if (Platform.OS === 'web') {
        await Linking.openURL(publicUrl);
        return;
      }

      const directory = await Directory.pickDirectoryAsync();

      const fileNameParts = /^(.*?)(\.[^.]+)?$/.exec(fileName);
      const fileBaseName = fileNameParts?.[1] || fileName;
      const fileExtension = fileNameParts?.[2] || '';
      const localFile = await File.downloadFileAsync(
        publicUrl,
        new File(Paths.cache, `${pattern.id}-${fileName}`),
        { idempotent: true },
      );

      let destinationFile: File | null = null;
      let destinationName = fileName;
      try {
        for (let suffix = 0; suffix <= 100; suffix += 1) {
          destinationName = suffix === 0
            ? fileName
            : `${fileBaseName} (${suffix})${fileExtension}`;
          if (directory.list().some((entry) => entry.name === destinationName)) continue;

          try {
            destinationFile = directory.createFile(destinationName, 'application/octet-stream');
            break;
          } catch (error) {
            if (!(error instanceof Error) || !error.message.toLowerCase().includes('already exists')) {
              throw error;
            }
          }
        }

        if (!destinationFile) {
          throw new Error(t('Could not find an available filename in the selected folder.'));
        }

        try {
          await destinationFile.write(await localFile.bytes());
        } catch (error) {
          if (destinationFile.exists) destinationFile.delete();
          throw error;
        }
      } finally {
        if (localFile.exists) localFile.delete();
      }

      Alert.alert(t('Download complete'), t('{file} was saved to {folder}.')
        .replace('{file}', destinationFile.name)
        .replace('{folder}', directory.name));
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('cancel')) return;
      setDownloadError(error instanceof Error ? error.message : `Could not download ${pattern.name}.`);
    } finally {
      setDownloadingPatternId(null);
    }
  };

  const signIn = async () => {
    const client = supabase;
    if (!client) return;
    setAdminBusy(true);
    setAdminError(null);
    try {
      const { error } = await client.auth.signInWithPassword({
        email: adminEmailInput.trim(),
        password,
      });
      if (error) setAdminError(error.message);
      else setPassword('');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : t('Sign in failed. Please try again.'));
    } finally {
      setAdminBusy(false);
    }
  };

  const signOut = async () => {
    const client = supabase;
    if (!client) return;
    setAdminBusy(true);
    setCustomerAuthError(null);
    try {
      const { error } = await client.auth.signOut();
      if (error) {
        setAdminError(error.message);
        setCustomerAuthError(error.message);
      } else {
        setShowAdmin(false);
      }
    } catch (error) {
      const message = getErrorMessage(error, t('Sign out failed. Please try again.'));
      setAdminError(message);
      setCustomerAuthError(message);
    } finally {
      setAdminBusy(false);
    }
  };

  const signInWithGoogle = async (action: 'signIn' | 'signUp') => {
    const client = supabase;
    if (!client) return;
    setCustomerAuthAction(action);
    setCustomerAuthError(null);
    try {
      const redirectTo = ExpoLinking.createURL('auth/callback');
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });
      if (error) throw error;

      if (Platform.OS === 'web') return;
      if (!data.url) throw new Error(t('Google sign-in failed. Please try again.'));

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return;

      const callbackUrl = new URL(result.url);
      const callbackError = callbackUrl.searchParams.get('error_description')
        ?? callbackUrl.searchParams.get('error');
      if (callbackError) throw new Error(callbackError);

      const code = callbackUrl.searchParams.get('code');
      if (!code) throw new Error(t('Google sign-in did not return an authorization code.'));

      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } catch (error) {
      setCustomerAuthError(getErrorMessage(error, t('Google sign-in failed. Please try again.')));
    } finally {
      setCustomerAuthAction(null);
    }
  };

  const pickPatternFile = async () => {
    try {
      const result = await File.pickFileAsync({ mimeTypes: '*/*' });
      if (result.canceled) return;
      const file = result.result;
      setPickedFile(file);
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : t('Could not open the file picker.'));
    }
  };

  const pickDesignImage = async () => {
    try {
      const result = await File.pickFileAsync({ mimeTypes: 'image/*' });
      if (result.canceled) return;
      const file = result.result;
      const extension = file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
      const supportedImageExtensions = ['avif', 'bmp', 'gif', 'heic', 'heif', 'jpeg', 'jpg', 'png', 'webp'];
      if (!file.type?.startsWith('image/') && !supportedImageExtensions.includes(extension ?? '')) {
        setAdminError(t('Choose an image file.'));
        return;
      }
      setPickedImage(file);
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : t('Could not open the file picker.'));
    }
  };

  const uploadPattern = async () => {
    const client = supabase;
    if (!client || !session || session.user.email?.trim().toLowerCase() !== adminEmail) return;
    if (!patternName.trim() || !stitches.trim() || !hoopSize.trim() || !pickedFile || !pickedImage) {
      setAdminError(t('Choose both a .DST file and a design image.'));
      return;
    }
    setAdminBusy(true);
    setAdminError(null);
    const pickedFileName = getDisplayFileName(pickedFile);
    const safeFileName = pickedFileName.toLowerCase().endsWith('.dst')
      ? pickedFileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `pattern-${Date.now()}.dst`;
    const uploadId = Date.now();
    const objectPath = `${session.user.id}/${uploadId}-with-image-${safeFileName}`;
    const imageMimeType = pickedImage.type?.toLowerCase() ?? '';
    const imageExtension = pickedImage.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase()
      ?? ({
        'image/avif': 'avif',
        'image/bmp': 'bmp',
        'image/gif': 'gif',
        'image/heic': 'heic',
        'image/heif': 'heif',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }[imageMimeType] ?? 'jpg');
    const imagePath = `${session.user.id}/${uploadId}-image`;
    const imageContentType = imageMimeType.startsWith('image/')
      ? imageMimeType
      : `image/${imageExtension === 'jpg' ? 'jpeg' : imageExtension}`;
    const uploadedPaths: string[] = [];
    try {
      const fileBytes = await pickedFile.arrayBuffer();
      if (fileBytes.byteLength > 25 * 1024 * 1024) {
        throw new Error(t('Files must be 25 MB or smaller.'));
      }
      const imageBytes = await pickedImage.arrayBuffer();
      if (imageBytes.byteLength > 10 * 1024 * 1024) {
        throw new Error(t('Images must be 10 MB or smaller.'));
      }
      const { error: fileError } = await client.storage
        .from('patterns')
        .upload(objectPath, fileBytes, { contentType: 'application/octet-stream', upsert: false });
      if (fileError) throw fileError;
      uploadedPaths.push(objectPath);

      const { error: imageError } = await client.storage
        .from('patterns')
        .upload(imagePath, imageBytes, { contentType: imageContentType, upsert: false });
      if (imageError) throw imageError;
      uploadedPaths.push(imagePath);

      const details = categoryDetails[patternCategory] ?? { art: '🧵', color: '#E4E9D8' };
      const { data, error: rowError } = await client
        .from('patterns')
        .insert({
          name: patternName.trim(),
          category: patternCategory,
          stitches: stitches.trim(),
          hoop_size: hoopSize.trim(),
          object_path: objectPath,
          art: details.art,
          color: details.color,
        })
        .select('id, name, category, stitches, hoop_size, art, color, object_path')
        .single();
      if (rowError) {
        throw rowError;
      }

      setPatterns((current) => [{
        id: data.id,
        name: data.name,
        category: data.category,
        stitches: data.stitches,
        size: data.hoop_size,
        objectPath: data.object_path,
        imagePath,
        imageUrl: client.storage.from('patterns').getPublicUrl(imagePath).data.publicUrl,
        art: data.art,
        color: data.color,
      }, ...current]);
      setPatternName('');
      setStitches('');
      setHoopSize('');
      setPickedFile(null);
      setPickedImage(null);
    } catch (error) {
      const message = getErrorMessage(error, t('The pattern could not be uploaded.'));
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await client.storage.from('patterns').remove(uploadedPaths);
        if (cleanupError) {
          setAdminError(`${message} ${t('Uploaded files could not be cleaned up')}: ${cleanupError.message}`);
          return;
        }
      }
      setAdminError(message);
    } finally {
      setAdminBusy(false);
    }
  };

  const deletePattern = (pattern: Pattern) => {
    const client = supabase;
    if (!client || !pattern.objectPath || session?.user.email?.trim().toLowerCase() !== adminEmail) return;
    const objectPath = pattern.objectPath;
    Alert.alert(t('Delete pattern?'), t('Remove "{name}" from the catalog?').replace('{name}', pattern.name), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: () => {
          setAdminBusy(true);
          setAdminError(null);
          void (async () => {
            const pathsToRemove = [objectPath, pattern.imagePath].filter((path): path is string => Boolean(path));
            const { error: fileError } = await client.storage.from('patterns').remove(pathsToRemove);
            if (fileError) throw fileError;
            const { error: rowError } = await client.from('patterns').delete().eq('id', pattern.id);
            if (rowError) throw rowError;
            setPatterns((current) => current.filter((item) => item.id !== pattern.id));
          })().catch((error: unknown) => {
            setAdminError(error instanceof Error ? error.message : t('The pattern could not be deleted.'));
          }).finally(() => setAdminBusy(false));
        },
      },
    ]);
  };

  return (
    <LanguageContext.Provider value={language}>
    <SafeAreaView style={[styles.safeArea, { direction: isArabic ? 'rtl' : 'ltr' }]}>
      <StatusBar style="dark" />
      <Modal
        visible={previewPattern !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewPattern(null)}
        statusBarTranslucent
      >
        {previewPattern?.imageUrl && (
          <View style={styles.imageModal}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle} numberOfLines={1}>{previewPattern.name}</Text>
              <Pressable
                onPress={() => setPreviewPattern(null)}
                style={styles.imageModalClose}
                accessibilityRole="button"
                accessibilityLabel={t('Close image preview')}
              >
                <Text style={styles.imageModalCloseText}>×</Text>
              </Pressable>
            </View>
            <Image
              source={{ uri: previewPattern.imageUrl }}
              style={styles.imageModalContent}
              resizeMode="contain"
              accessibilityLabel={t('Design image for {name}').replace('{name}', previewPattern.name)}
            />
          </View>
        )}
      </Modal>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            style={styles.brand}
            onLongPress={() => {
              if (!sessionReady || (!session && !isSupabaseConfigured) || (session && !isOwner)) return;
              setShowAdmin(true);
              setAdminError(null);
            }}
            delayLongPress={1200}
            accessibilityRole="button"
            accessibilityLabel="Rachmati"
          >
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>✳</Text></View>
            <View>
              <Text style={styles.brandName}>RACHMATI</Text>
              <Text style={styles.brandSubtitle}>{t('A little thread goes a long way')}</Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.languageButton}
              onPress={() => changeLanguage(isArabic ? 'en' : 'ar')}
              accessibilityRole="button"
              accessibilityLabel={t('Choose a language')}
            >
              <Text style={styles.languageButtonText}>{isArabic ? 'English' : 'العربية'}</Text>
            </Pressable>
            {session && !showAdmin && (
              <Pressable
                style={styles.avatar}
                onPress={signOut}
                disabled={adminBusy}
                accessibilityRole="button"
                accessibilityLabel={t('Sign out')}
              >
                <Text style={styles.avatarText}>↪</Text>
              </Pressable>
            )}
            {showAdmin && (!session || isOwner) && (
              <Pressable
                style={styles.avatar}
                onPress={() => setShowAdmin(false)}
                accessibilityRole="button"
                accessibilityLabel={t('Return to pattern catalog')}
              >
                <Text style={styles.avatarText}>×</Text>
              </Pressable>
            )}
          </View>
        </View>

        {showAdmin && (!session || isOwner) ? (
          <View style={styles.adminSection}>
            <Text style={styles.eyebrow}>{t('OWNER ONLY')}</Text>
            <Text style={styles.sectionTitle}>{t('Manage patterns')}</Text>
            <Text style={styles.sectionSubtitle}>{t('Sign in to publish and manage your .DST designs.')}</Text>
            {!isSupabaseConfigured || !adminEmail ? (
              <View style={styles.setupNotice}>
                <Text style={styles.emptyTitle}>{t('Connect your private cloud')}</Text>
                <Text style={styles.emptyText}>
                  {t('Add your Supabase project URL, publishable key, and owner email to the local .env file, then restart Expo. The setup steps and security policies are in supabase/setup.sql.')}
                </Text>
              </View>
            ) : !isOwner ? (
              <View style={styles.adminForm}>
                {session ? (
                  <>
                    <Text style={styles.emptyTitle}>{t('This account is not the owner')}</Text>
                    <Text style={styles.emptyText}>{t('Sign in with the owner email configured for this app.')}</Text>
                    <Pressable style={styles.secondaryButton} onPress={signOut} disabled={adminBusy}>
                      <Text style={styles.secondaryButtonText}>{t('Sign out')}</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <TextInput
                      value={adminEmailInput}
                      onChangeText={setAdminEmailInput}
                      placeholder={t('Owner email')}
                      placeholderTextColor="#8B9087"
                      style={styles.adminInput}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('Password')}
                      placeholderTextColor="#8B9087"
                      style={styles.adminInput}
                      secureTextEntry
                      autoComplete="password"
                    />
                    <Pressable style={styles.primaryButton} onPress={signIn} disabled={adminBusy}>
                      <Text style={styles.primaryButtonText}>{t(adminBusy ? 'Signing in…' : 'Sign in as owner')}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : (
              <>
                <View style={styles.adminForm}>
                  <Text style={styles.ownerEmail}>{t('Signed in as {email}').replace('{email}', session?.user.email ?? '')}</Text>
                  <TextInput
                    value={patternName}
                    onChangeText={setPatternName}
                    placeholder={t('Design name')}
                    placeholderTextColor="#8B9087"
                    style={[styles.adminInput, isArabic && styles.rtlInput]}
                  />
                  <Text style={styles.fieldLabel}>{t('Category')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
                    {categories.slice(1).map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => setPatternCategory(item)}
                        style={[styles.categoryChip, patternCategory === item && styles.activeCategoryChip]}
                      >
                        <Text style={[styles.categoryText, patternCategory === item && styles.activeCategoryText]}>{t(item)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <TextInput
                    value={stitches}
                    onChangeText={setStitches}
                    placeholder={t('Stitch count (for example 8,200)')}
                    placeholderTextColor="#8B9087"
                    style={[styles.adminInput, isArabic && styles.rtlInput]}
                  />
                  <TextInput
                    value={hoopSize}
                    onChangeText={setHoopSize}
                    placeholder={t('Hoop size (for example 4 × 4 in)')}
                    placeholderTextColor="#8B9087"
                    style={[styles.adminInput, isArabic && styles.rtlInput]}
                  />
                  <Pressable style={styles.secondaryButton} onPress={pickPatternFile} disabled={adminBusy}>
                    <Text style={styles.secondaryButtonText}>
                      {pickedFile
                        ? `${isArabic ? 'تم الاختيار: ' : 'Selected: '}${getDisplayFileName(pickedFile) === 'DST file selected' ? t('DST file selected') : getDisplayFileName(pickedFile)}`
                        : t('Choose .DST file (max 25 MB)')}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={pickDesignImage} disabled={adminBusy}>
                    <View style={styles.imagePickerContent}>
                      {pickedImage && <Image source={{ uri: pickedImage.uri }} style={styles.imagePreview} />}
                      <Text style={styles.secondaryButtonText}>
                        {pickedImage
                          ? `${t('Image selected')}: ${pickedImage.name}`
                          : t('Choose design image')}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable style={styles.primaryButton} onPress={uploadPattern} disabled={adminBusy}>
                    <Text style={styles.primaryButtonText}>{t(adminBusy ? 'Please wait…' : 'Upload and publish pattern')}</Text>
                  </Pressable>
                  <Pressable style={styles.signOutButton} onPress={signOut} disabled={adminBusy}>
                    <Text style={styles.signOutText}>{t('Sign out')}</Text>
                  </Pressable>
                </View>
                <View style={styles.adminList}>
                  <Text style={styles.sectionTitle}>{t('Published designs')}</Text>
                  {patterns.filter((pattern) => pattern.objectPath).map((pattern) => (
                    <View key={pattern.id} style={styles.adminPatternRow}>
                      <Text style={styles.adminPatternName} numberOfLines={1}>{pattern.name}</Text>
                      <Pressable onPress={() => deletePattern(pattern)} disabled={adminBusy}>
                        <Text style={styles.deleteText}>{t('Delete')}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            )}
            {(adminError || languageError) && <Text style={styles.errorText}>{t(adminError ?? languageError ?? '')}</Text>}
          </View>
        ) : !isSupabaseConfigured ? (
          <View style={styles.authSection}>
            <View style={styles.welcome}>
              <Text style={styles.eyebrow}>{t('Welcome to Rachmati')}</Text>
              <Text style={[styles.title, isArabic && styles.arabicTitle]}>{t('Sign in or create an account')}</Text>
            </View>
            <View style={styles.setupNotice}>
              <Text style={styles.emptyTitle}>{t('Connect your private cloud')}</Text>
              <Text style={styles.emptyText}>
                {t('Add your Supabase project URL, publishable key, and owner email to the local .env file, then restart Expo. The setup steps and security policies are in supabase/setup.sql.')}
              </Text>
            </View>
            {languageError && <Text style={styles.errorText}>{t(languageError)}</Text>}
          </View>
        ) : !sessionReady ? (
          <View style={styles.authSection}>
            <Text style={styles.authLoading}>{t('Preparing your account…')}</Text>
          </View>
        ) : !session ? (
          <View style={styles.authSection}>
            <View style={styles.welcome}>
              <Text style={styles.eyebrow}>{t('Welcome to Rachmati')}</Text>
              <Text style={[styles.title, isArabic && styles.arabicTitle]}>{t('Find your next\nfavorite stitch.')}</Text>
              <Text style={styles.intro}>{t('Sign in with your Google account to browse embroidery designs.')}</Text>
            </View>
            <View style={styles.authCard}>
              <Text style={styles.sectionTitle}>{t('Sign in or create an account')}</Text>
              <Text style={styles.sectionSubtitle}>{t('Sign in with your Google account to browse embroidery designs.')}</Text>
              <Pressable
                style={styles.googleButton}
                onPress={() => signInWithGoogle('signIn')}
                disabled={customerAuthAction !== null}
                accessibilityRole="button"
              >
                <Text style={styles.googleMark}>G</Text>
                <Text style={styles.googleButtonText}>
                  {t(customerAuthAction === 'signIn' ? 'Signing in with Google…' : 'Login with Google')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.googleButton, styles.googleSignUpButton]}
                onPress={() => signInWithGoogle('signUp')}
                disabled={customerAuthAction !== null}
                accessibilityRole="button"
              >
                <Text style={styles.googleMark}>G</Text>
                <Text style={styles.googleSignUpText}>
                  {t(customerAuthAction === 'signUp' ? 'Creating your account…' : 'Sign up with Google')}
                </Text>
              </Pressable>
              <Text style={styles.authHint}>{t('New customers are registered automatically when they continue with Google.')}</Text>
              {(customerAuthError || languageError) && (
                <Text style={styles.errorText}>{t(customerAuthError ?? languageError ?? '')}</Text>
              )}
            </View>
          </View>
        ) : (
          <>
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>{t('YOUR CREATIVE CORNER')}</Text>
          <Text style={[styles.title, isArabic && styles.arabicTitle]}>{t('Find your next\nfavorite stitch.')}</Text>
          <Text style={styles.intro}>{t('Explore embroidery designs made for your machine.')}</Text>
        </View>

        <View style={styles.curatedBanner}>
          <View style={styles.curatedMark}>
            <Text style={styles.curatedMarkText}>✿</Text>
          </View>
          <View style={styles.curatedCopy}>
            <Text style={styles.curatedTitle}>{t('Curated by Rachmati')}</Text>
            <Text style={styles.curatedCaption}>{t('Thoughtfully selected designs for your next project')}</Text>
          </View>
        </View>

        <View style={styles.adSpace}>
          <Text style={styles.adLabel}>{t('ADVERTISEMENT')}</Text>
          <Text style={styles.adText}>{t('A little space for something lovely')}</Text>
          <Text style={styles.adNote}>{t('Ad partner can be connected before launch')}</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('Search embroidery patterns')}
            placeholderTextColor="#8B9087"
            style={[styles.searchInput, isArabic && styles.rtlInput]}
            returnKeyType="search"
            accessibilityLabel={t('Search embroidery patterns')}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityLabel={t('Clear search')}>
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.tabs}>
          {(['Explore', 'Saved'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[styles.tab, tab === item && styles.activeTab]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === item }}
            >
              <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{t(item)}</Text>
              {item === 'Saved' && saved.length > 0 && (
                <Text style={styles.tabCount}>{saved.length}</Text>
              )}
            </Pressable>
          ))}
        </View>

        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.categoryChip, category === item && styles.activeCategoryChip]}
                accessibilityRole="button"
                accessibilityState={{ selected: category === item }}
              >
                <Text style={[styles.categoryText, category === item && styles.activeCategoryText]}>{t(item)}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t(tab === 'Saved' ? 'Saved designs' : 'Made for your hoop')}</Text>
                <Text style={styles.sectionSubtitle}>
                  {t(tab === 'Saved' ? 'Your bookmarked sample patterns' : 'Available designs for your catalog')}
                </Text>
              </View>
              <Text style={styles.resultCount}>{t('{count} designs').replace('{count}', String(visiblePatterns.length))}</Text>
            </View>

            {catalogError && <Text style={styles.errorText}>{t(catalogError)}</Text>}
            {(customerAuthError || downloadError || languageError) && (
              <Text style={styles.errorText}>{t(customerAuthError ?? downloadError ?? languageError ?? '')}</Text>
            )}
            {isSupabaseConfigured && patterns.length === 0 && !catalogError && (
              <Text style={styles.emptyText}>{t('No designs have been published yet.')}</Text>
            )}

            {visiblePatterns.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{tab === 'Saved' ? '♡' : '⌕'}</Text>
                <Text style={styles.emptyTitle}>{t(tab === 'Saved' ? 'No saved designs yet' : 'No patterns found')}</Text>
                <Text style={styles.emptyText}>
                  {t(tab === 'Saved' ? 'Tap the heart on a design to keep it close.' : 'Try another search or category.')}
                </Text>
              </View>
            ) : visiblePatterns.map((pattern) => (
              <View key={pattern.id} style={styles.patternCard}>
                <View style={[styles.patternArt, { backgroundColor: pattern.color }]}>
                  {pattern.imageUrl && !failedImageIds.includes(pattern.id) ? (
                    <Pressable
                      onPress={() => setPreviewPattern(pattern)}
                      style={styles.patternImageButton}
                      accessibilityRole="button"
                      accessibilityLabel={t('Design image for {name}').replace('{name}', pattern.name)}
                    >
                      <Image
                        source={{ uri: pattern.imageUrl }}
                        style={styles.patternImage}
                        resizeMode="cover"
                        onError={() => setFailedImageIds((current) => (
                          current.includes(pattern.id) ? current : [...current, pattern.id]
                        ))}
                        accessibilityLabel={t('Design image for {name}').replace('{name}', pattern.name)}
                      />
                    </Pressable>
                  ) : (
                    <Text style={styles.patternEmoji}>{pattern.art}</Text>
                  )}
                  <Text style={styles.dstBadge}>DST</Text>
                </View>
                <View style={styles.patternInfo}>
                  <Text style={styles.patternCategory}>{isArabic ? t(pattern.category) : pattern.category.toUpperCase()}</Text>
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <Text style={styles.patternMeta}>{t('{count} stitches').replace('{count}', pattern.stitches)}  ·  {pattern.size}</Text>
                </View>
                <Pressable
                  onPress={() => toggleSaved(pattern.id)}
                  style={styles.heartButton}
                  accessibilityRole="button"
                  accessibilityLabel={t(saved.includes(pattern.id) ? 'Remove {name} from saved' : 'Save {name}').replace('{name}', pattern.name)}
                >
                  <Text style={[styles.heart, saved.includes(pattern.id) && styles.savedHeart]}>
                    {saved.includes(pattern.id) ? '♥' : '♡'}
                  </Text>
                </Pressable>
                {pattern.objectPath && (
                  <Pressable
                    onPress={() => downloadPattern(pattern)}
                    style={styles.downloadButton}
                    disabled={downloadingPatternId !== null}
                    accessibilityRole="button"
                    accessibilityLabel={t('Save {name} DST file to your device').replace('{name}', pattern.name)}
                  >
                    <Text style={styles.downloadIcon}>
                      {downloadingPatternId === pattern.id ? '…' : '↓'}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </>

        <Text style={styles.footer}>{t('Made with care, one stitch at a time.')}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    </LanguageContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F5' },
  page: { paddingHorizontal: 22, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#25483A', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#F4D59A', fontSize: 24 },
  brandName: { color: '#26372F', fontSize: 14, fontWeight: '800', letterSpacing: 1.3 },
  brandSubtitle: { color: '#7C8077', fontSize: 10, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEE8DC', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#7E6247', fontSize: 20 },
  languageButton: { minHeight: 38, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#E1E9DD', alignItems: 'center', justifyContent: 'center' },
  languageButtonText: { color: '#315643', fontSize: 12, fontWeight: '700' },
  welcome: { marginBottom: 18 },
  authSection: { minHeight: 420, justifyContent: 'center', paddingBottom: 24 },
  authCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEECE5', borderRadius: 16, padding: 18, marginTop: 8 },
  authLoading: { color: '#70776D', fontSize: 13, textAlign: 'center', paddingVertical: 28 },
  googleButton: { minHeight: 48, borderRadius: 11, backgroundColor: '#25483A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginTop: 14 },
  googleMark: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginEnd: 10 },
  googleButtonText: { color: '#FFFDF8', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  googleSignUpButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADDD5', marginTop: 9 },
  googleSignUpText: { color: '#315643', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  authHint: { color: '#85877F', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 14 },
  eyebrow: { color: '#9A7451', fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  title: { color: '#26372F', fontSize: 34, fontWeight: '700', lineHeight: 39, letterSpacing: -0.8 },
  arabicTitle: { fontSize: 31, lineHeight: 43, letterSpacing: 0 },
  intro: { color: '#70776D', fontSize: 13, marginTop: 9 },
  curatedBanner: { backgroundColor: '#25483A', borderRadius: 16, minHeight: 66, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  curatedMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#355C49', alignItems: 'center', justifyContent: 'center', marginEnd: 12 },
  curatedMarkText: { color: '#F1D49C', fontSize: 22 },
  curatedCopy: { flex: 1 },
  curatedTitle: { color: '#FFFDF8', fontWeight: '700', fontSize: 14 },
  curatedCaption: { color: '#CBD6CC', fontSize: 11, marginTop: 3 },
  adSpace: { backgroundColor: '#F1EEE7', minHeight: 66, borderRadius: 12, borderWidth: 1, borderColor: '#E7E2D8', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  adLabel: { color: '#929087', fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  adText: { color: '#686B62', fontSize: 11, marginTop: 3 },
  adNote: { color: '#9A9A90', fontSize: 9, marginTop: 2 },
  searchBox: { minHeight: 47, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE9E1', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 15 },
  searchIcon: { color: '#767E73', fontSize: 25, marginEnd: 9 },
  searchInput: { flex: 1, color: '#303B32', fontSize: 13, paddingVertical: 10 },
  clearSearch: { color: '#767E73', fontSize: 22, paddingHorizontal: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E8E6DE', marginBottom: 15, gap: 24 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, gap: 5 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#315643' },
  tabText: { color: '#868980', fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#315643' },
  tabCount: { color: '#315643', fontSize: 10, fontWeight: '700' },
  adminSection: { paddingTop: 4, paddingBottom: 24 },
  adminForm: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEECE5', borderRadius: 15, padding: 14, marginTop: 16 },
  setupNotice: { backgroundColor: '#F3F1EB', borderRadius: 14, padding: 16, marginTop: 16 },
  adminInput: { minHeight: 46, borderRadius: 11, backgroundColor: '#FAF9F5', borderWidth: 1, borderColor: '#E8E6DE', color: '#303B32', fontSize: 13, paddingHorizontal: 12, marginBottom: 10 },
  rtlInput: { textAlign: 'right', writingDirection: 'rtl' },
  fieldLabel: { color: '#70776D', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  ownerEmail: { color: '#315643', fontSize: 11, fontWeight: '600', marginBottom: 12 },
  primaryButton: { minHeight: 46, borderRadius: 11, backgroundColor: '#25483A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginTop: 4 },
  primaryButtonText: { color: '#FFFDF8', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { minHeight: 44, borderRadius: 11, backgroundColor: '#E1E9DD', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginBottom: 10 },
  secondaryButtonText: { color: '#315643', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  imagePickerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePreview: { width: 36, height: 36, borderRadius: 6 },
  signOutButton: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  signOutText: { color: '#74786E', fontSize: 11, fontWeight: '600' },
  adminList: { marginTop: 22 },
  adminPatternRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E8E6DE' },
  adminPatternName: { flex: 1, color: '#303C33', fontSize: 12, fontWeight: '600', marginEnd: 12 },
  deleteText: { color: '#BC594F', fontSize: 11, fontWeight: '700', padding: 8 },
  errorText: { color: '#A33B32', fontSize: 11, lineHeight: 17, marginTop: 12 },
  categories: { gap: 8, paddingBottom: 18 },
  categoryChip: { borderRadius: 18, backgroundColor: '#F0EEE8', paddingHorizontal: 14, paddingVertical: 8 },
  activeCategoryChip: { backgroundColor: '#E1E9DD' },
  categoryText: { color: '#74786E', fontSize: 11, fontWeight: '600' },
  activeCategoryText: { color: '#315643' },
  section: { marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: '#29382F', fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { color: '#85877F', fontSize: 10, marginTop: 4 },
  resultCount: { color: '#929188', fontSize: 10, paddingBottom: 2 },
  patternCard: { minHeight: 91, backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#EEECE5', flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 10 },
  patternArt: { width: 68, height: 68, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  patternImageButton: { width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' },
  patternImage: { width: '100%', height: '100%', borderRadius: 12 },
  imageModal: { flex: 1, backgroundColor: '#111A', justifyContent: 'center', padding: 18, paddingTop: 56, paddingBottom: 36 },
  imageModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  imageModalTitle: { flex: 1, color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginEnd: 12 },
  imageModalClose: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF33' },
  imageModalCloseText: { color: '#FFFFFF', fontSize: 30, lineHeight: 34 },
  imageModalContent: { width: '100%', flex: 1 },
  patternEmoji: { fontSize: 31 },
  dstBadge: { position: 'absolute', right: 4, bottom: 4, backgroundColor: '#FFFFFFCC', color: '#566252', fontSize: 7, fontWeight: '800', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  patternInfo: { flex: 1, paddingHorizontal: 12 },
  patternCategory: { color: '#9B7654', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  patternName: { color: '#303C33', fontSize: 13, fontWeight: '700', marginTop: 4 },
  patternMeta: { color: '#85877F', fontSize: 10, marginTop: 5 },
  heartButton: { width: 32, height: 42, alignItems: 'center', justifyContent: 'center' },
  heart: { color: '#94958C', fontSize: 22 },
  savedHeart: { color: '#BC725D' },
  downloadButton: { width: 36, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1E9DD', marginStart: 4 },
  downloadIcon: { color: '#315643', fontSize: 22, fontWeight: '700' },
  emptyState: { alignItems: 'center', backgroundColor: '#F3F1EB', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 24, marginTop: 5 },
  emptyIcon: { fontSize: 27, color: '#67806A', marginBottom: 8 },
  emptyTitle: { color: '#344438', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#85877F', fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 5 },
  footer: { color: '#A1A096', fontSize: 10, textAlign: 'center', marginTop: 24 },
});
