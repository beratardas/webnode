'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useLoadScript, Libraries, InfoWindow, Marker } from '@react-google-maps/api';
import { Wheel } from 'react-custom-roulette';
import Header from '@/app/components/Header';
import Image from 'next/image';
import Link from 'next/link';

const activities = [
  { 
    name: 'Kafeye Git', 
    searchTerm: 'cafe',
    alternativeTerms: ['kafe', 'kahve', 'çay', 'cafe'],
    icon: '☕', 
    style: { backgroundColor: '#9333ea', textColor: '#ffffff' },
    longDistance: false
  },
  { 
    name: 'Sinemaya Git', 
    searchTerm: 'sinema',
    alternativeTerms: ['sinema', 'film'],
    icon: '🎬', 
    style: { backgroundColor: '#7e22ce', textColor: '#ffffff' },
    longDistance: false
  },
  { 
    name: 'Yürüyüşe Çık', 
    searchTerm: 'park',
    alternativeTerms: ['park', 'yuruyus yolu', 'yürüyüş', 'milli park', 'orman'],
    icon: '🌳', 
    style: { backgroundColor: '#6d28d9', textColor: '#ffffff' },
    longDistance: false
  },
  { 
    name: 'Kampa Git', 
    searchTerm: 'campground', 
    alternativeTerms: ['forest', 'natural_feature', 'orman', 'milli park', 'tabiat parkı'],
    icon: '⛺', 
    style: { backgroundColor: '#5b21b6', textColor: '#ffffff' },
    longDistance: true
  },
  { 
    name: 'Yüzmeye Git', 
    searchTerm: 'swimming_pool',
    alternativeTerms: ['plaj', 'havuz', 'halk plajı', 'beach', 'yüzme havuzu'],
    icon: '🏊', 
    style: { backgroundColor: '#4c1d95', textColor: '#ffffff' },
    longDistance: true
  },
  { 
    name: 'AVMye Git', 
    searchTerm: 'shopping_mall',
    alternativeTerms: ['avm', 'alisveris', 'alışveriş merkezi', 'shopping mall'],
    icon: '🛍️',
    style: { backgroundColor: '#7e22ce', textColor: '#ffffff' },
    longDistance: false
  }
];

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: true,
  fullscreenControl: false,
  styles: [
    {
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }]
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }]
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }]
    }
  ]
};

const center = {
  lat: 41.0082,
  lng: 28.9784
};

interface Place {
  id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  photos?: { getUrl: () => string }[];
  posts?: Post[];
  isExpanded?: boolean;
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  location: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
  likes: { id: string }[];
}

const libraries: Libraries = ['places'];

const CustomMarker = ({ place, onClick, map }: { place: Place; onClick: () => void; map: google.maps.Map | null }) => {
  return (
    <Marker
      position={{
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      }}
      onClick={onClick}
      title={place.name}
      icon={{
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#9333ea',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }}
      animation={window.google.maps.Animation.DROP}
    />
  );
};

export default function Dashboard() {
  const router = useRouter();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(center);
  const [places, setPlaces] = useState<Place[]>([]);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);
  const [placePosts, setPlacePosts] = useState<{ [key: string]: Post[] }>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (error) {
      console.error('Token çözme hatası:', error);
      localStorage.removeItem('token');
      router.push('/auth/signin');
    }
  }, [router]);

  const { isLoaded: isScriptLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'tr',
    region: 'TR'
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          if (mapRef.current) {
            mapRef.current.panTo(newLocation);
          }
        },
        (error) => {
          console.error('Konum alınamadı:', error);
        }
      );
    }
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log('Harita yükleniyor...');
    mapRef.current = map;
    setMap(map);
    
    // Places service'i başlat
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Places API yükleniyor...');
      const service = new window.google.maps.places.PlacesService(map);
      setPlacesService(service);
      console.log('Places API yüklendi');
    } else {
      console.error('Google Maps Places API yüklenemedi');
    }
    
    setIsLoaded(true);
    console.log('Harita yüklendi');
  }, []);

  const onLoadError = useCallback((error: Error) => {
    console.error('Harita yükleme hatası:', error);
    setLoadError(error);
  }, []);

  const searchNearbyPlaces = useCallback(async (searchTerm: string) => {
    console.log('Arama başlatılıyor...', { map, isScriptLoaded, searchTerm, placesService });
    setSearchError(null);
    
    if (!map || !isScriptLoaded || !window.google || !placesService) {
      console.error('Harita veya Places API yüklenemedi', {
        mapExists: !!map,
        isScriptLoaded,
        googleExists: !!window.google,
        placesServiceExists: !!placesService
      });
      return;
    }

    const selectedActivity = activities.find(a => a.searchTerm === searchTerm);
    if (!selectedActivity) {
      console.error('Aktivite bulunamadı');
      return;
    }

    const searchRadius = selectedActivity.longDistance ? 100000 : 20000; // 100km veya 20km

    try {
      const textSearchRequest = {
        query: selectedActivity.alternativeTerms.join(' OR '),
        location: userLocation,
        radius: searchRadius,
        language: 'tr'
      };

      const textResults = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
        placesService.textSearch(textSearchRequest, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            resolve([]);
          }
        });
      });

      if (textResults.length === 0) {
        setSearchError(`Üzgünüz, yakınınızda ${selectedActivity.name.toLowerCase()} aktivitesini gerçekleştirebileceğiniz bir yer bulamadık. Başka bir aktivite denemeye ne dersiniz?`);
        setPlaces([]);
        return;
      }

      const processedResults = textResults.map(place => ({
        id: place.place_id!,
        name: place.name!,
        vicinity: place.formatted_address!,
        geometry: {
          location: {
            lat: place.geometry!.location!.lat(),
            lng: place.geometry!.location!.lng()
          }
        },
        rating: place.rating,
        photos: place.photos?.map(photo => ({
          getUrl: () => photo.getUrl({ maxWidth: 400, maxHeight: 300 })
        }))
      }));

      setPlaces(processedResults);

      const bounds = new window.google.maps.LatLngBounds();
      processedResults.forEach(place => {
        bounds.extend(new window.google.maps.LatLng(
          place.geometry.location.lat,
          place.geometry.location.lng
        ));
      });
      map.fitBounds(bounds);

    } catch (error) {
      console.error('Arama sırasında hata:', error);
      setSearchError('Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [map, isScriptLoaded, userLocation, placesService]);

  const spinWheel = useCallback(() => {
    if (!isSpinning) {
      const newPrizeNumber = Math.floor(Math.random() * activities.length);
      setPrizeNumber(newPrizeNumber);
      setIsSpinning(true);
      setShowMap(false);
      setSelectedActivity('');
      setPlaces([]);
      setSelectedPlace(null);
    }
  }, [isSpinning]);

  // Belirli bir mekanın gönderilerini getiren fonksiyon
  const fetchPlacePosts = async (placeId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Gönderiler yüklenemedi');
      
      const allPosts = await response.json();
      const placeSpecificPosts = allPosts
        .filter((post: Post) => post.placeId === placeId)
        .slice(0, 3);
      
      setPlacePosts(prev => ({
        ...prev,
        [placeId]: placeSpecificPosts
      }));
    } catch (error) {
      console.error('Gönderi yükleme hatası:', error);
    }
  };

  // Mekan genişletme/daraltma fonksiyonu
  const togglePlace = async (placeId: string, placeName: string) => {
    if (expandedPlace === placeId) {
      setExpandedPlace(null);
    } else {
      setExpandedPlace(placeId);
      if (!placePosts[placeId]) {
        await fetchPlacePosts(placeId);
      }
    }
  };

  if (!user || !isScriptLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 to-purple-900">
        <div className="text-white text-2xl">Yükleniyor...</div>
      </div>
    );
  }

  if (scriptLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 to-purple-900">
        <div className="text-red-500 text-xl text-center">
          <p>Harita yüklenirken bir hata oluştu.</p>
          <p className="mt-2">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-purple-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            Hoş Geldin, {user?.name}!
          </h1>

          <div className="flex gap-8">
            {/* Sol Taraf - Çark ve Aktivite Bilgisi */}
            <div className="w-1/2">
              {/* Çark */}
              <div className="wheel-container">
                <Wheel
                  mustStartSpinning={isSpinning}
                  prizeNumber={prizeNumber}
                  data={activities.map(activity => ({
                    option: `${activity.icon} ${activity.name}`,
                    style: { backgroundColor: activity.style.backgroundColor, textColor: activity.style.textColor }
                  }))}
                  backgroundColors={activities.map(a => a.style.backgroundColor)}
                  textColors={activities.map(a => a.style.textColor)}
                  fontSize={16}
                  outerBorderColor="#4c1d95"
                  outerBorderWidth={3}
                  innerRadius={20}
                  innerBorderColor="#4c1d95"
                  innerBorderWidth={2}
                  radiusLineColor="#4c1d95"
                  radiusLineWidth={2}
                  perpendicularText={true}
                  textDistance={85}
                  onStopSpinning={() => {
                    setIsSpinning(false);
                    const selectedAct = activities[prizeNumber];
                    setSelectedActivity(selectedAct.name);
                    setShowMap(true);
                    console.log('Seçilen aktivite:', selectedAct);
                    searchNearbyPlaces(selectedAct.searchTerm);
                  }}
                />
                
                <button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className="spin-button"
                >
                  {isSpinning ? '...' : 'Çevir'}
                </button>
              </div>

              {/* Seçilen Aktivite Bilgisi */}
              {selectedActivity && (
                <div className="bg-gray-700 rounded-lg p-6 text-white mt-7">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    {activities.find(a => a.name === selectedActivity)?.icon}
                    {selectedActivity}
                  </h2>
                  {searchError ? (
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <p className="text-gray-300">{searchError}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-300 mb-4">
                        Yakınınızdaki {selectedActivity.toLowerCase()} mekanları haritada gösteriliyor...
                      </p>
                      {places.length > 0 && (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                          {places.map((place) => (
                            <div
                              key={place.id}
                              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                              onClick={() => {
                                setSelectedPlace(place);
                                if (map) {
                                  map.panTo(place.geometry.location);
                                  map.setZoom(16);
                                }
                              }}
                            >
                              <h3 className="font-bold text-lg">{place.name}</h3>
                              <p className="text-gray-400 text-sm">{place.vicinity}</p>
                              {place.rating && (
                                <div className="mt-2 flex items-center gap-1">
                                  <span className="text-yellow-400">⭐</span>
                                  <span>{place.rating}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sağ Taraf - Harita */}
            <div className="w-1/2">
              <div className="bg-gray-700 rounded-lg p-4 h-[800px]">
                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '0.5rem'
                  }}
                  center={userLocation}
                  zoom={14}
                  onLoad={onMapLoad}
                  options={defaultMapOptions}
                >
                  {places.map((place) => (
                    <CustomMarker
                      key={place.id}
                      place={place}
                      onClick={() => setSelectedPlace(place)}
                      map={map}
                    />
                  ))}
                  
                  {selectedPlace && (
                    <InfoWindow
                      position={{
                        lat: selectedPlace.geometry.location.lat,
                        lng: selectedPlace.geometry.location.lng
                      }}
                      onCloseClick={() => setSelectedPlace(null)}
                    >
                      <div className="min-w-[200px]">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-gray-800">{selectedPlace.name}</h3>
                          <button
                            onClick={() => togglePlace(selectedPlace.id, selectedPlace.name)}
                            className="bg-purple-600 text-white px-3 py-1 text-sm rounded-full hover:bg-purple-700 transition-colors"
                          >
                            {expandedPlace === selectedPlace.id ? 'Gönderileri Gizle' : 'Gönderileri Göster'}
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{selectedPlace.vicinity}</p>
                        {selectedPlace.rating && (
                          <p className="mb-2 text-sm">
                            <span className="font-semibold text-gray-700">Puan:</span>{' '}
                            <span className="text-yellow-500">{selectedPlace.rating} ⭐</span>
                          </p>
                        )}
                        {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                          <img
                            src={selectedPlace.photos[0].getUrl()}
                            alt={selectedPlace.name}
                            className="w-full h-32 object-cover rounded-lg shadow-md"
                          />
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            </div>
          </div>
        </div>

        {selectedPlace && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">📍</span>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                    {selectedPlace.name}
                  </span>
                </h2>
                <p className="text-gray-400 mt-1">{selectedPlace.vicinity}</p>
              </div>
              <button
                onClick={() => togglePlace(selectedPlace.id, selectedPlace.name)}
                className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
              >
                {expandedPlace === selectedPlace.id ? 'Gönderileri Gizle' : 'Gönderileri Göster'}
              </button>
            </div>
            
            {expandedPlace === selectedPlace.id && (
              <div className="mt-4">
                {placePosts[selectedPlace.id]?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {placePosts[selectedPlace.id].map((post) => (
                      <div key={post.id} className="bg-gray-700 rounded-lg overflow-hidden">
                        <div className="p-2">
                          <div className="flex items-center space-x-2">
                            <Link href={`/profile/${post.user.username}`}>
                              {post.user.profileImage ? (
                                <Image
                                  src={post.user.profileImage}
                                  alt={post.user.name || ''}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                                  {post.user.name?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </Link>
                            <Link
                              href={`/profile/${post.user.username}`}
                              className="text-sm font-medium text-white hover:text-purple-400 truncate"
                            >
                              {post.user.name}
                            </Link>
                          </div>
                        </div>
                        <div className="relative aspect-square">
                          <Image
                            src={post.imageUrl}
                            alt={post.caption || 'Gönderi'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-2">
                          {post.caption && (
                            <p className="text-white text-sm line-clamp-2">{post.caption}</p>
                          )}
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">Bu konumda henüz gönderi paylaşılmamış.</p>
                )}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              {selectedPlace.rating && (
                <p className="text-yellow-400 flex items-center gap-1">
                  <span className="text-lg">⭐</span>
                  <span className="font-medium">{selectedPlace.rating}</span>
                  <span className="text-gray-400 text-sm ml-1">puan</span>
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 