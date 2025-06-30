# RideLink - Ride App Launcher

A React Native Expo app that allows users to compare and open ride-sharing apps with their route pre-filled, saving time by avoiding manual entry of pickup and destination addresses.

## Features

- 🚗 **Multi-App Support**: Open Uber, Lyft, and other ride apps with pre-filled routes
- 📍 **Smart Location**: Use current location or search for addresses with autocomplete
- 🌍 **Multi-Language**: Support for English, Portuguese, and Spanish
- ⭐ **Favorites**: Save frequently visited places for quick access
- 🎯 **Precise Coordinates**: Uses Google Places API for accurate location data
- 📱 **Cross-Platform**: Works on iOS, Android, and Web

## Setup

### Prerequisites

- Node.js 18+ 
- Expo CLI
- Google Maps API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. **Configure Google Maps API Key**:
   - Get an API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Enable the following APIs:
     - Places API
     - Places API (New) 
     - Geocoding API
   - Copy `.env.example` to `.env` and add your API key:
     ```
     EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Google Maps API Setup

The app requires a Google Maps API key for address autocomplete functionality:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Required APIs**:
   - Places API
   - Places API (New)
   - Geocoding API

3. **Create API Key**:
   - Go to "Credentials" in the API & Services section
   - Click "Create Credentials" > "API Key"
   - Copy the generated key

4. **Configure API Key**:
   - Add the key to your `.env` file:
     ```
     EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     ```

5. **Set API Restrictions** (Recommended):
   - For web deployment, add your domain to HTTP referrers
   - For mobile apps, add your bundle identifier/package name

## How It Works

1. **Enter Addresses**: Use the smart autocomplete to enter pickup and destination addresses
2. **Get Current Location**: Tap the location button to auto-fill your current address
3. **Choose Ride App**: Select from available ride-sharing apps
4. **Open with Route**: The app opens with your route pre-filled and precise coordinates

## Supported Ride Apps

- **Uber**: Full deep-link support with coordinates and place IDs
- **Lyft**: Coordinate-based routing
- **Taxi**: Generic taxi service integration

## Architecture

- **Framework**: React Native with Expo
- **Navigation**: Expo Router with tab-based layout
- **State Management**: React Context for auth and language
- **Styling**: StyleSheet with responsive design
- **APIs**: Google Places Autocomplete & Place Details
- **Storage**: AsyncStorage for favorites and user preferences

## Development

### Project Structure

```
app/
├── (auth)/          # Authentication screens
├── (tabs)/          # Main tab navigation
│   ├── index.tsx    # Ride launcher (main screen)
│   ├── favorites.tsx
│   ├── profile.tsx
│   └── settings.tsx
components/          # Reusable components
contexts/           # React Context providers
hooks/              # Custom hooks
```

### Key Components

- **GooglePlacesInput**: Smart address autocomplete with location bias
- **RideAppButton**: Handles deep-linking to ride apps
- **GradientBackground**: Consistent app styling
- **AuthGuard**: Route protection

### Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Deployment

### Web Deployment

The app is configured for web deployment with:

- Static export support
- Responsive design
- Progressive Web App features

### Mobile Deployment

- iOS: App Store deployment ready
- Android: Google Play Store ready
- Expo Application Services (EAS) compatible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple platforms
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the GitHub Issues
- Review the Google Maps API setup guide
- Ensure all required APIs are enabled in Google Cloud Console

---

**Note**: Remember to keep your Google Maps API key secure and never commit it to version control. Use environment variables and proper API restrictions for production deployments.