import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'pt' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app_language';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setCurrentLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on app start
  useEffect(() => {
    loadSavedLanguage().catch((error) => {
      console.error('❌ Failed to load saved language:', error);
      // Continue with default language
      setIsLoading(false);
    });
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && ['en', 'pt', 'es'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      // Don't throw, just use default
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Error saving language:', error);
      // Still update the current language even if saving fails
      setCurrentLanguage(lang);
      throw error; // Re-throw so UI can handle the error
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    try {
      let translation = translations[language]?.[key];
      if (!translation) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        translation = translations.en[key] || key;
      }

      // Replace parameters in translation
      if (params && typeof translation === 'string') {
        Object.keys(params).forEach(param => {
          translation = translation.replace(`{${param}}`, params[param]);
        });
      }

      return translation;
    } catch (error) {
      console.error('Error in translation function:', error);
      return key; // Fallback to the key itself
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation data
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Title
    'app.title': 'RideLink',
    'app.subtitle': 'Compare and open ride apps with your route pre-filled',
    
    // Navigation
    'nav.rideLauncher': 'Ride Launcher',
    'nav.favorites': 'Favorites',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    
    // Main Screen
    'main.pickupLabel': '📍 Pickup Address',
    'main.pickupPlaceholder': 'Enter your pickup address',
    'main.destinationLabel': '🎯 Destination Address',
    'main.destinationPlaceholder': 'Enter destination address',
    'main.useCurrentLocation': 'Use my current location',
    'main.gettingLocation': 'Getting location...',
    'main.chooseRideApp': '🚕 Choose Your Ride App',
    'main.openIn': 'Open in',
    'main.pickupCopied': 'Pickup address copied!',
    'main.destinationCopied': 'Destination address copied!',
    
    // Location warnings
    'location.warning': '⚠️ Approximate address detected based on location. Please verify and adjust the number if needed.',
    'location.coordinatesRequired': 'To ensure precise coordinates, select addresses using the autocomplete suggestions.',
    
    // How to use
    'howTo.title': '💡 How to use',
    'howTo.step1': '1. Enter and select your pickup address or use your current location',
    'howTo.step2': '2. Enter and select your destination using autocomplete',
    'howTo.step3': '3. Tap the button of your desired ride app',
    'howTo.step4': '4. The app will open with your route already filled with precise coordinates',
    
    // Alerts and errors
    'alert.requiredAddresses': 'Please fill in both pickup and destination addresses.',
    'alert.coordinatesRequired': 'Please select addresses using the autocomplete to get precise coordinates.',
    'alert.locationError': 'Could not get your current location. Check if location services are enabled.',
    'alert.permissionDenied': 'Location permission denied. Please allow location access in your browser settings.',
    'alert.locationUnavailable': 'Location unavailable at the moment. Check if location services are enabled.',
    'alert.locationTimeout': 'Location request timed out. Please try again.',
    'alert.error': 'Error',
    'alert.ok': 'OK',
    'alert.cancel': 'Cancel',
    'alert.openBrowser': 'Open Browser',
    'alert.openSettings': 'Open Settings',
    'alert.openPlayStore': 'Open Play Store',
    
    // Favorites Screen
    'favorites.title': 'Favorites',
    'favorites.places': 'Places',
    'favorites.routes': 'Routes',
    'favorites.noFavorites': 'No favorites yet',
    'favorites.noFavoritesSubtitle': 'Add your frequently visited places to quickly access them later',
    'favorites.addFavorite': 'Add Favorite',
    'favorites.editFavorite': 'Edit Favorite',
    'favorites.deleteFavorite': 'Delete Favorite',
    'favorites.deleteConfirm': 'Are you sure you want to delete',
    'favorites.delete': 'Delete',
    'favorites.save': 'Save',
    'favorites.nameLabel': 'Name',
    'favorites.namePlaceholder': 'e.g., Home, Work, Gym',
    'favorites.addressLabel': 'Address',
    'favorites.addressPlaceholder': 'Search for an address...',
    'favorites.requiredFields': 'Please enter both name and address.',
    'favorites.saveError': 'Could not save favorite. Please try again.',
    'favorites.loading': 'Loading favorites...',
    'favorites.coordinatesDetected': 'Precise Location Detected',
    'favorites.latitude': 'Latitude',
    'favorites.longitude': 'Longitude',
    'favorites.tip': 'Tip',
    'favorites.tipDescription': 'Use the address search to find and select a location with precise coordinates. This ensures accurate navigation when using ride apps.',
    'favorites.autoFilled': 'Address filled from favorite',
    'favorites.routeAutoFilled': 'Route filled from favorite',
    
    // Route Favorites
    'routeFavorites.title': 'Route Favorites',
    'routeFavorites.addRoute': 'Add Route',
    'routeFavorites.editRoute': 'Edit Route',
    'routeFavorites.newRoute': 'New Route',
    'routeFavorites.routeName': 'Route Name',
    'routeFavorites.routeNamePlaceholder': 'e.g., Home → Work, Airport → Hotel',
    'routeFavorites.pickupLabel': '📍 Pickup Location',
    'routeFavorites.pickupPlaceholder': 'Search for pickup location...',
    'routeFavorites.destinationLabel': '🎯 Destination',
    'routeFavorites.destinationPlaceholder': 'Search for destination...',
    'routeFavorites.save': 'Save Route',
    'routeFavorites.saving': 'Saving...',
    'routeFavorites.updated': 'Route updated',
    'routeFavorites.savedRoutes': 'Saved Routes',
    'routeFavorites.noRoutes': 'No routes saved yet',
    'routeFavorites.noRoutesSubtitle': 'Save your frequently used routes for quick access',
    'routeFavorites.deleteRoute': 'Delete Route',
    'routeFavorites.deleteConfirm': 'Are you sure you want to delete',
    'routeFavorites.delete': 'Delete',
    'routeFavorites.loading': 'Loading routes...',
    'routeFavorites.requiredFields': 'Please enter route name, pickup, and destination.',
    'routeFavorites.saveError': 'Could not save route. Please try again.',
    'routeFavorites.tip': 'Tip',
    'routeFavorites.tipDescription': 'Tap on any saved route to quickly fill the main screen with your pickup and destination addresses.',
    'routeFavorites.creationTip': 'Fill in the pickup and destination fields and tap "Save" to add the route to your favorites.',
    'routeFavorites.editTip': 'Update the route information and tap "Save" to save your changes.',
    
    // Settings Screen
    'settings.title': 'Settings',
    'settings.appSettings': 'App Settings',
    'settings.theme': 'Theme',
    'settings.themeSubtitle': 'Choose your preferred theme appearance',
    'settings.language': 'Language',
    'settings.languageSubtitle': 'Choose your preferred language',
    'settings.locationServices': 'Location Services',
    'settings.locationServicesSubtitle': 'Manage permissions and location accuracy',
    'settings.support': 'Support',
    'settings.about': 'About',
    'settings.aboutSubtitle': 'App version and supported ride services',
    'settings.feedback': 'Send Feedback',
    'settings.feedbackSubtitle': 'Help us improve RideLink',
    'settings.howItWorks': 'How It Works',
    'settings.howItWorksText': 'RideLink automatically detects your current location and allows you to enter a destination. When you tap a ride app button, it opens that app with your route pre-filled, saving you time from manually entering addresses.',
    'settings.supportedApps': 'Supported Apps',
    'settings.importantNote': '📝 Important Note',
    'settings.importantNoteText': 'You can edit the pickup address even after using current location. This is useful when GPS detects a slightly different street number than the actual one.',
    
    // App Manager
    'appManager.title': 'Manage Integrated Apps',
    'appManager.subtitle': 'Choose which ride apps to show on the main screen',
    'appManager.summary': 'Active Apps',
    'appManager.enabledApps': '{count} of {total} apps enabled',
    'appManager.instructions': 'Enable or disable ride apps to customize your experience. Only enabled apps will appear on the main screen.',
    'appManager.availableApps': 'Available Apps',
    'appManager.enabled': 'Enabled - Will appear on main screen',
    'appManager.disabled': 'Disabled - Hidden from main screen',
    'appManager.note': '📱 Installation Required',
    'appManager.noteDescription': 'Apps must be installed on your device to work. If an app is not installed, you\'ll be redirected to the app store.',
    'appManager.resetTitle': 'Reset to Defaults',
    'appManager.resetConfirm': 'This will reset all app preferences to default settings. Continue?',
    'appManager.reset': 'Reset',
    'appManager.noAppsEnabled': 'No Apps Enabled',
    'appManager.enableAppsInSettings': 'Go to Settings > Manage Integrated Apps to enable ride apps.',
    
    // Theme options
    'theme.light': 'Light',
    'theme.lightDescription': 'Clean and bright interface',
    'theme.dark': 'Dark',
    'theme.darkDescription': 'Easy on the eyes in low light',
    'theme.auto': 'Auto',
    'theme.autoDescription': 'Follows your system setting',
    
    // Language names
    'language.english': 'English',
    'language.portuguese': 'Português',
    'language.spanish': 'Español',
    
    // About dialog
    'about.title': 'About RideLink',
    'about.content': 'RideLink v1.0.0\n\nA simple app to open ride-sharing services with your route pre-filled. Save time by avoiding manual entry of pickup and destination addresses.\n\nSupported apps: Uber, 99, Lyft, Bolt, Grab, Careem, Ola, Yandex Go, inDriver, Taxi.Rio',
    
    // Feedback dialog
    'feedback.title': 'Feedback',
    'feedback.content': 'We\'d love to hear from you! Contact us with suggestions or issues.',
    
    // Location settings dialog
    'locationSettings.title': 'Location Settings',
    'locationSettings.content': 'To ensure accurate pickup addresses, make sure location services are enabled for this app in your device settings.',
    'locationSettings.openSettings': 'Please open device settings manually to adjust location permissions.',
    
    // API Key error
    'apiKey.required': '🔑 API Key Required',
    'apiKey.instructions': 'To use address autocomplete, you need to:',
    'apiKey.steps': '1. Get a Google Maps API key\n2. Enable the Places API\n3. Set the EXPO_PUBLIC_GOOGLE_MAPS_API_KEY variable\n4. For web: add *.bolt.new/* to allowed domains',
    'apiKey.link': 'Visit: console.cloud.google.com/apis/credentials',
    
    // Ride app messages
    'rideApp.opened': 'Opened',
    'rideApp.verifyAddresses': 'Please verify the addresses were filled correctly:',
    'rideApp.pickup': '📍 Pickup:',
    'rideApp.destination': '🎯 Destination:',
    'rideApp.notInstalled': 'Not Installed',
    'rideApp.appNotInstalled': 'The {appName} app is not installed. Open in app store?',
    'rideApp.webNotSupported': 'This app is not supported on web. Install the mobile app to use this feature.',
    'rideApp.openingPlayStore': 'Opening App Store',
    'rideApp.manualEntry': 'You may need to enter addresses manually:',
    'rideApp.appNotAvailable': 'App Not Available',
    'rideApp.notAvailableMessage': 'is not available on this device.',
    'rideApp.errorOpening': 'Could not open the app. Please try again.',
  },
  
  pt: {
    // App Title
    'app.title': 'RideLink',
    'app.subtitle': 'Compare e abra aplicativos de transporte com sua rota pré-preenchida',
    
    // Navigation
    'nav.rideLauncher': 'Lançador de Corridas',
    'nav.favorites': 'Favoritos',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configurações',
    
    // Main Screen
    'main.pickupLabel': '📍 Endereço de Partida',
    'main.pickupPlaceholder': 'Digite seu endereço de partida',
    'main.destinationLabel': '🎯 Endereço de Destino',
    'main.destinationPlaceholder': 'Digite o endereço de destino',
    'main.useCurrentLocation': 'Usar minha localização atual',
    'main.gettingLocation': 'Obtendo localização...',
    'main.chooseRideApp': '🚕 Escolha Seu App de Transporte',
    'main.openIn': 'Abrir no',
    'main.pickupCopied': 'Endereço de partida copiado!',
    'main.destinationCopied': 'Endereço de destino copiado!',
    
    // Location warnings
    'location.warning': '⚠️ Endereço aproximado detectado com base na localização. Verifique e ajuste o número se necessário.',
    'location.coordinatesRequired': 'Para garantir coordenadas precisas, selecione endereços usando as sugerências de preenchimento automático.',
    
    // How to use
    'howTo.title': '💡 Como usar',
    'howTo.step1': '1. Digite e selecione seu endereço de partida ou use sua localização atual',
    'howTo.step2': '2. Digite e selecione seu destino usando o preenchimento automático',
    'howTo.step3': '3. Toque no botão do aplicativo de transporte desejado',
    'howTo.step4': '4. O aplicativo abrirá com sua rota já preenchida com coordenadas precisas',
    
    // Alerts and errors
    'alert.requiredAddresses': 'Preencha os endereços de partida e destino.',
    'alert.coordinatesRequired': 'Selecione endereços usando o preenchimento automático para obter coordenadas precisas.',
    'alert.locationError': 'Não foi possível obter sua localização atual. Verifique se os serviços de localização estão habilitados.',
    'alert.permissionDenied': 'Permissão de localização negada. Permita o acesso à localização nas configurações do navegador.',
    'alert.locationUnavailable': 'Localização indisponível no momento. Verifique se os serviços de localização estão habilitados.',
    'alert.locationTimeout': 'Tempo limite da solicitação de localização. Tente novamente.',
    'alert.error': 'Erro',
    'alert.ok': 'OK',
    'alert.cancel': 'Cancelar',
    'alert.openBrowser': 'Abrir Navegador',
    'alert.openSettings': 'Abrir Configurações',
    'alert.openPlayStore': 'Abrir Play Store',
    
    // Favorites Screen
    'favorites.title': 'Favoritos',
    'favorites.places': 'Locais',
    'favorites.routes': 'Rotas',
    'favorites.noFavorites': 'Nenhum favorito ainda',
    'favorites.noFavoritesSubtitle': 'Adicione seus locais frequentemente visitados para acessá-los rapidamente depois',
    'favorites.addFavorite': 'Adicionar Favorito',
    'favorites.editFavorite': 'Editar Favorito',
    'favorites.deleteFavorite': 'Excluir Favorito',
    'favorites.deleteConfirm': 'Tem certeza de que deseja excluir',
    'favorites.delete': 'Excluir',
    'favorites.save': 'Salvar',
    'favorites.nameLabel': 'Nome',
    'favorites.namePlaceholder': 'ex: Casa, Trabalho, Academia',
    'favorites.addressLabel': 'Endereço',
    'favorites.addressPlaceholder': 'Busque por um endereço...',
    'favorites.requiredFields': 'Digite o nome e o endereço.',
    'favorites.saveError': 'Não foi possível salvar o favorito. Tente novamente.',
    'favorites.loading': 'Carregando favoritos...',
    'favorites.coordinatesDetected': 'Localização Precisa Detectada',
    'favorites.latitude': 'Latitude',
    'favorites.longitude': 'Longitude',
    'favorites.tip': 'Dica',
    'favorites.tipDescription': 'Use a busca de endereços para encontrar e selecionar um local com coordenadas precisas. Isso garante navegação precisa ao usar apps de corrida.',
    'favorites.autoFilled': 'Endereço preenchido com base no favorito',
    'favorites.routeAutoFilled': 'Rota preenchida com base no favorito',
    
    // Route Favorites
    'routeFavorites.title': 'Rotas Favoritas',
    'routeFavorites.addRoute': 'Adicionar Rota',
    'routeFavorites.editRoute': 'Editar Rota',
    'routeFavorites.newRoute': 'Nova Rota',
    'routeFavorites.routeName': 'Nome da Rota',
    'routeFavorites.routeNamePlaceholder': 'ex: Casa → Trabalho, Aeroporto → Hotel',
    'routeFavorites.pickupLabel': '📍 Local de Partida',
    'routeFavorites.pickupPlaceholder': 'Busque o local de partida...',
    'routeFavorites.destinationLabel': '🎯 Destino',
    'routeFavorites.destinationPlaceholder': 'Busque o destino...',
    'routeFavorites.save': 'Salvar Rota',
    'routeFavorites.saving': 'Salvando...',
    'routeFavorites.updated': 'Rota atualizada',
    'routeFavorites.savedRoutes': 'Rotas Salvas',
    'routeFavorites.noRoutes': 'Nenhuma rota salva ainda',
    'routeFavorites.noRoutesSubtitle': 'Salve suas rotas mais usadas para acesso rápido',
    'routeFavorites.deleteRoute': 'Excluir Rota',
    'routeFavorites.deleteConfirm': 'Tem certeza de que deseja excluir',
    'routeFavorites.delete': 'Excluir',
    'routeFavorites.loading': 'Carregando rotas...',
    'routeFavorites.requiredFields': 'Digite o nome da rota, partida e destino.',
    'routeFavorites.saveError': 'Não foi possível salvar a rota. Tente novamente.',
    'routeFavorites.tip': 'Dica',
    'routeFavorites.tipDescription': 'Toque em qualquer rota salva para preencher rapidamente a tela principal com seus endereços de partida e destino.',
    'routeFavorites.creationTip': 'Preencha os campos de partida e destino e toque em "Salvar" para adicionar a rota aos seus favoritos.',
    'routeFavorites.editTip': 'Atualize as informações da rota e toque em "Salvar" para salvar suas alterações.',
    
    // Settings Screen
    'settings.title': 'Configurações',
    'settings.appSettings': 'Configurações do App',
    'settings.theme': 'Tema',
    'settings.themeSubtitle': 'Escolha a aparência do tema preferido',
    'settings.language': 'Idioma',
    'settings.languageSubtitle': 'Escolha seu idioma preferido',
    'settings.locationServices': 'Serviços de Localização',
    'settings.locationServicesSubtitle': 'Gerenciar permissões e precisão da localização',
    'settings.support': 'Suporte',
    'settings.about': 'Sobre',
    'settings.aboutSubtitle': 'Versão do app e serviços de transporte suportados',
    'settings.feedback': 'Enviar Feedback',
    'settings.feedbackSubtitle': 'Ajude-nos a melhorar o RideLink',
    'settings.howItWorks': 'Como Funciona',
    'settings.howItWorksText': 'O RideLink detecta automaticamente sua localização atual e permite inserir um destino. Quando você toca no botão de um app de transporte, ele abre com sua rota pré-preenchida, economizando tempo ao evitar a inserção manual de endereços.',
    'settings.supportedApps': 'Apps Suportados',
    'settings.importantNote': '📝 Nota Importante',
    'settings.importantNoteText': 'Você pode editar o endereço de partida mesmo após usar a localização atual. Isso é útil quando o GPS detecta um número de rua ligeiramente diferente do real.',
    
    // App Manager
    'appManager.title': 'Gerenciar Apps Integrados',
    'appManager.subtitle': 'Escolha quais apps de corrida mostrar na tela principal',
    'appManager.summary': 'Apps Ativos',
    'appManager.enabledApps': '{count} de {total} apps habilitados',
    'appManager.instructions': 'Habilite ou desabilite apps de corrida para personalizar sua experiência. Apenas apps habilitados aparecerão na tela principal.',
    'appManager.availableApps': 'Apps Disponíveis',
    'appManager.enabled': 'Habilitado - Aparecerá na tela principal',
    'appManager.disabled': 'Desabilitado - Oculto da tela principal',
    'appManager.note': '📱 Instalação Necessária',
    'appManager.noteDescription': 'Os apps devem estar instalados no seu dispositivo para funcionar. Se um app não estiver instalado, você será redirecionado para a loja de apps.',
    'appManager.resetTitle': 'Restaurar Padrões',
    'appManager.resetConfirm': 'Isso restaurará todas as preferências de apps para as configurações padrão. Continuar?',
    'appManager.reset': 'Restaurar',
    'appManager.noAppsEnabled': 'Nenhum App Habilitado',
    'appManager.enableAppsInSettings': 'Vá para Configurações > Gerenciar Apps Integrados para habilitar apps de corrida.',
    
    // Theme options
    'theme.light': 'Claro',
    'theme.lightDescription': 'Interface limpa e brilhante',
    'theme.dark': 'Escuro',
    'theme.darkDescription': 'Suave para os olhos em pouca luz',
    'theme.auto': 'Automático',
    'theme.autoDescription': 'Segue a configuração do sistema',
    
    // Language names
    'language.english': 'English',
    'language.portuguese': 'Português',
    'language.spanish': 'Español',
    
    // About dialog
    'about.title': 'Sobre o RideLink',
    'about.content': 'RideLink v1.0.0\n\nUm aplicativo simples para abrir serviços de transporte compartilhado com sua rota pré-preenchida. Economize tempo evitando a inserção manual de endereços de partida e destino.\n\nApps suportados: Uber, 99, Lyft, Bolt, Grab, Careem, Ola, Yandex Go, inDriver, Taxi.Rio',
    
    // Feedback dialog
    'feedback.title': 'Feedback',
    'feedback.content': 'Adoraríamos ouvir você! Entre em contato conosco com sugestões ou problemas.',
    
    // Location settings dialog
    'locationSettings.title': 'Configurações de Localização',
    'locationSettings.content': 'Para garantir endereços de partida precisos, certifique-se de que os serviços de localização estejam habilitados para este aplicativo nas configurações do dispositivo.',
    'locationSettings.openSettings': 'Abra as configurações do dispositivo manualmente para ajustar as permissões de localização.',
    
    // API Key error
    'apiKey.required': '🔑 Chave da API Necessária',
    'apiKey.instructions': 'Para usar o preenchimento automático de endereços, você precisa:',
    'apiKey.steps': '1. Obter uma chave da API do Google Maps\n2. Habilitar a API Places\n3. Definir a variável EXPO_PUBLIC_GOOGLE_MAPS_API_KEY\n4. Para web: adicionar *.bolt.new/* aos domínios permitidos',
    'apiKey.link': 'Visite: console.cloud.google.com/apis/credentials',
    
    // Ride app messages
    'rideApp.opened': 'Aberto',
    'rideApp.verifyAddresses': 'Verifique se os endereços foram preenchidos corretamente:',
    'rideApp.pickup': '📍 Partida:',
    'rideApp.destination': '🎯 Destino:',
    'rideApp.notInstalled': 'Não Instalado',
    'rideApp.appNotInstalled': 'O aplicativo {appName} não está instalado. Abrir na loja de apps?',
    'rideApp.webNotSupported': 'Este app não é suportado na web. Instale o app móvel para usar este recurso.',
    'rideApp.openingPlayStore': 'Abrindo Loja de Apps',
    'rideApp.manualEntry': 'Você pode precisar inserir os endereços manualmente:',
    'rideApp.appNotAvailable': 'App Não Disponível',
    'rideApp.notAvailableMessage': 'não está disponível neste dispositivo.',
    'rideApp.errorOpening': 'Não foi possível abrir o app. Tente novamente.',
  },
  
  es: {
    // App Title
    'app.title': 'RideLink',
    'app.subtitle': 'Compara y abre aplicaciones de transporte con tu ruta prellenada',
    
    // Navigation
    'nav.rideLauncher': 'Lanzador de Viajes',
    'nav.favorites': 'Favoritos',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configuración',
    
    // Main Screen
    'main.pickupLabel': '📍 Dirección de Recogida',
    'main.pickupPlaceholder': 'Ingresa tu dirección de recogida',
    'main.destinationLabel': '🎯 Dirección de Destino',
    'main.destinationPlaceholder': 'Ingresa la dirección de destino',
    'main.useCurrentLocation': 'Usar mi ubicación actual',
    'main.gettingLocation': 'Obteniendo ubicación...',
    'main.chooseRideApp': '🚕 Elige Tu App de Transporte',
    'main.openIn': 'Abrir en',
    'main.pickupCopied': '¡Dirección de recogida copiada!',
    'main.destinationCopied': '¡Dirección de destino copiada!',
    
    // Location warnings
    'location.warning': '⚠️ Dirección aproximada detectada basada en la ubicación. Verifica y ajusta el número si es necesario.',
    'location.coordinatesRequired': 'Para asegurar coordenadas precisas, selecciona direcciones usando las sugerencias de autocompletado.',
    
    // How to use
    'howTo.title': '💡 Cómo usar',
    'howTo.step1': '1. Ingresa y selecciona tu dirección de recogida o usa tu ubicación actual',
    'howTo.step2': '2. Ingresa y selecciona tu destino usando el autocompletado',
    'howTo.step3': '3. Toca el botón de la aplicación de transporte deseada',
    'howTo.step4': '4. La aplicación se abrirá con tu ruta ya llena con coordenadas precisas',
    
    // Alerts and errors
    'alert.requiredAddresses': 'Completa las direcciones de recogida y destino.',
    'alert.coordinatesRequired': 'Selecciona direcciones usando el autocompletado para obtener coordenadas precisas.',
    'alert.locationError': 'No se pudo obtener tu ubicación actual. Verifica si los servicios de ubicación están habilitados.',
    'alert.permissionDenied': 'Permiso de ubicación denegado. Permite el acceso a la ubicación en la configuración del navegador.',
    'alert.locationUnavailable': 'Ubicación no disponible en este momento. Verifica si los servicios de ubicación están habilitados.',
    'alert.locationTimeout': 'Tiempo de espera de solicitud de ubicación agotado. Inténtalo de nuevo.',
    'alert.error': 'Error',
    'alert.ok': 'OK',
    'alert.cancel': 'Cancelar',
    'alert.openBrowser': 'Abrir Navegador',
    'alert.openSettings': 'Abrir Configuración',
    'alert.openPlayStore': 'Abrir Play Store',
    
    // Favorites Screen
    'favorites.title': 'Favoritos',
    'favorites.places': 'Lugares',
    'favorites.routes': 'Rutas',
    'favorites.noFavorites': 'Aún no hay favoritos',
    'favorites.noFavoritesSubtitle': 'Agrega tus lugares frecuentemente visitados para acceder a ellos rápidamente después',
    'favorites.addFavorite': 'Agregar Favorito',
    'favorites.editFavorite': 'Editar Favorito',
    'favorites.deleteFavorite': 'Eliminar Favorito',
    'favorites.deleteConfirm': '¿Estás seguro de que quieres eliminar',
    'favorites.delete': 'Eliminar',
    'favorites.save': 'Guardar',
    'favorites.nameLabel': 'Nombre',
    'favorites.namePlaceholder': 'ej: Casa, Trabajo, Gimnasio',
    'favorites.addressLabel': 'Dirección',
    'favorites.addressPlaceholder': 'Busca una dirección...',
    'favorites.requiredFields': 'Ingresa el nombre y la dirección.',
    'favorites.saveError': 'No se pudo guardar el favorito. Inténtalo de nuevo.',
    'favorites.loading': 'Cargando favoritos...',
    'favorites.coordinatesDetected': 'Ubicación Precisa Detectada',
    'favorites.latitude': 'Latitud',
    'favorites.longitude': 'Longitud',
    'favorites.tip': 'Consejo',
    'favorites.tipDescription': 'Usa la búsqueda de direcciones para encontrar y seleccionar una ubicación con coordenadas precisas. Esto asegura navegación precisa al usar apps de transporte.',
    'favorites.autoFilled': 'Dirección llenada desde favorito',
    'favorites.routeAutoFilled': 'Ruta llenada desde favorito',
    
    // Route Favorites
    'routeFavorites.title': 'Rutas Favoritas',
    'routeFavorites.addRoute': 'Agregar Ruta',
    'routeFavorites.editRoute': 'Editar Ruta',
    'routeFavorites.newRoute': 'Nueva Ruta',
    'routeFavorites.routeName': 'Nombre de la Ruta',
    'routeFavorites.routeNamePlaceholder': 'ej: Casa → Trabajo, Aeropuerto → Hotel',
    'routeFavorites.pickupLabel': '📍 Lugar de Recogida',
    'routeFavorites.pickupPlaceholder': 'Busca el lugar de recogida...',
    'routeFavorites.destinationLabel': '🎯 Destino',
    'routeFavorites.destinationPlaceholder': 'Busca el destino...',
    'routeFavorites.save': 'Guardar Ruta',
    'routeFavorites.saving': 'Guardando...',
    'routeFavorites.updated': 'Ruta actualizada',
    'routeFavorites.savedRoutes': 'Rutas Guardadas',
    'routeFavorites.noRoutes': 'No hay rutas guardadas aún',
    'routeFavorites.noRoutesSubtitle': 'Guarda tus rutas más usadas para acceso rápido',
    'routeFavorites.deleteRoute': 'Eliminar Ruta',
    'routeFavorites.deleteConfirm': '¿Estás seguro de que quieres eliminar',
    'routeFavorites.delete': 'Eliminar',
    'routeFavorites.loading': 'Cargando rutas...',
    'routeFavorites.requiredFields': 'Ingresa el nombre de la ruta, recogida y destino.',
    'routeFavorites.saveError': 'No se pudo guardar la ruta. Inténtalo de nuevo.',
    'routeFavorites.tip': 'Consejo',
    'routeFavorites.tipDescription': 'Toca cualquier ruta guardada para llenar rápidamente la pantalla principal con tus direcciones de recogida y destino.',
    'routeFavorites.creationTip': 'Llena los campos de recogida y destino y toca "Guardar" para agregar la ruta a tus favoritos.',
    'routeFavorites.editTip': 'Actualiza la información de la ruta y toca "Guardar" para guardar tus cambios.',
    
    // Settings Screen
    'settings.title': 'Configuración',
    'settings.appSettings': 'Configuración de la App',
    'settings.theme': 'Tema',
    'settings.themeSubtitle': 'Elige la apariencia del tema preferido',
    'settings.language': 'Idioma',
    'settings.languageSubtitle': 'Elige tu idioma preferido',
    'settings.locationServices': 'Servicios de Ubicación',
    'settings.locationServicesSubtitle': 'Gestionar permisos y precisión de ubicación',
    'settings.support': 'Soporte',
    'settings.about': 'Acerca de',
    'settings.aboutSubtitle': 'Versión de la app y servicios de transporte compatibles',
    'settings.feedback': 'Enviar Comentarios',
    'settings.feedbackSubtitle': 'Ayúdanos a mejorar RideLink',
    'settings.howItWorks': 'Cómo Funciona',
    'settings.howItWorksText': 'RideLink detecta automáticamente tu ubicación actual y te permite ingresar un destino. Cuando tocas el botón de una app de transporte, se abre con tu ruta prellenada, ahorrándote tiempo al evitar la entrada manual de direcciones.',
    'settings.supportedApps': 'Apps Compatibles',
    'settings.importantNote': '📝 Nota Importante',
    'settings.importantNoteText': 'Puedes editar la dirección de recogida incluso después de usar la ubicación actual. Esto es útil cuando el GPS detecta un número de calle ligeramente diferente al real.',
    
    // App Manager
    'appManager.title': 'Gestionar Apps Integradas',
    'appManager.subtitle': 'Elige qué apps de transporte mostrar en la pantalla principal',
    'appManager.summary': 'Apps Activas',
    'appManager.enabledApps': '{count} de {total} apps habilitadas',
    'appManager.instructions': 'Habilita o deshabilita apps de transporte para personalizar tu experiencia. Solo las apps habilitadas aparecerán en la pantalla principal.',
    'appManager.availableApps': 'Apps Disponibles',
    'appManager.enabled': 'Habilitada - Aparecerá en la pantalla principal',
    'appManager.disabled': 'Deshabilitada - Oculta de la pantalla principal',
    'appManager.note': '📱 Instalación Requerida',
    'appManager.noteDescription': 'Las apps deben estar instaladas en tu dispositivo para funcionar. Si una app no está instalada, serás redirigido a la tienda de apps.',
    'appManager.resetTitle': 'Restaurar Valores Predeterminados',
    'appManager.resetConfirm': 'Esto restaurará todas las preferencias de apps a la configuración predeterminada. ¿Continuar?',
    'appManager.reset': 'Restaurar',
    'appManager.noAppsEnabled': 'No Hay Apps Habilitadas',
    'appManager.enableAppsInSettings': 'Ve a Configuración > Gestionar Apps Integradas para habilitar apps de transporte.',
    
    // Theme options
    'theme.light': 'Claro',
    'theme.lightDescription': 'Interfaz limpia y brillante',
    'theme.dark': 'Oscuro',
    'theme.darkDescription': 'Suave para los ojos en poca luz',
    'theme.auto': 'Automático',
    'theme.autoDescription': 'Sigue la configuración del sistema',
    
    // Language names
    'language.english': 'English',
    'language.portuguese': 'Português',
    'language.spanish': 'Español',
    
    // About dialog
    'about.title': 'Acerca de RideLink',
    'about.content': 'RideLink v1.0.0\n\nUna aplicación simple para abrir servicios de transporte compartido con tu ruta prellenada. Ahorra tiempo evitando la entrada manual de direcciones de recogida y destino.\n\nApps compatibles: Uber, 99, Lyft, Bolt, Grab, Careem, Ola, Yandex Go, inDriver, Taxi.Rio',
    
    // Feedback dialog
    'feedback.title': 'Comentarios',
    'feedback.content': '¡Nos encantaría escucharte! Contáctanos con sugerencias o problemas.',
    
    // Location settings dialog
    'locationSettings.title': 'Configuración de Ubicación',
    'locationSettings.content': 'Para asegurar direcciones de recogida precisas, asegúrate de que los servicios de ubicación estén habilitados para esta aplicación en la configuración del dispositivo.',
    'locationSettings.openSettings': 'Abre la configuración del dispositivo manualmente para ajustar los permisos de ubicación.',
    
    // API Key error
    'apiKey.required': '🔑 Clave de API Requerida',
    'apiKey.instructions': 'Para usar el autocompletado de direcciones, necesitas:',
    'apiKey.steps': '1. Obtener una clave de API de Google Maps\n2. Habilitar la API de Places\n3. Establecer la variable EXPO_PUBLIC_GOOGLE_MAPS_API_KEY\n4. Para web: agregar *.bolt.new/* a los dominios permitidos',
    'apiKey.link': 'Visita: console.cloud.google.com/apis/credentials',
    
    // Ride app messages
    'rideApp.opened': 'Abierta',
    'rideApp.verifyAddresses': 'Verifica que las direcciones se hayan llenado correctamente:',
    'rideApp.pickup': '📍 Recogida:',
    'rideApp.destination': '🎯 Destino:',
    'rideApp.notInstalled': 'No Instalada',
    'rideApp.appNotInstalled': 'La aplicación {appName} no está instalada. ¿Abrir en la tienda de apps?',
    'rideApp.webNotSupported': 'Esta app no es compatible con web. Instala la app móvil para usar esta función.',
    'rideApp.openingPlayStore': 'Abriendo Tienda de Apps',
    'rideApp.manualEntry': 'Puede que necesites ingresar las direcciones manualmente:',
    'rideApp.appNotAvailable': 'App No Disponible',
    'rideApp.notAvailableMessage': 'no está disponible en este dispositivo.',
    'rideApp.errorOpening': 'No se pudo abrir la app. Inténtalo de nuevo.',
  },
};