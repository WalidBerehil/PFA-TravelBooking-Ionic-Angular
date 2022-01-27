import { ModalController } from '@ionic/angular';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Renderer2, OnDestroy, Input } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
	selector: 'app-map-modal',
	templateUrl: './map-modal.component.html',
	styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit, AfterViewInit, OnDestroy {

	
	@ViewChild('map') mapElementRef: ElementRef;
	@Input() center = { lat: 34.68244312386074, lng: -1.8860077304766762 };
	@Input() selectable = true;
	@Input() closeButtonText = 'Cancel';
	@Input() title = 'Pick Location';
	clickListener: any;
	googleMaps: any;

	constructor(private modalCtrl: ModalController, private renderer: Renderer2) { }

	ngOnInit() {
	}

	
	ngAfterViewInit() {
		this.getGoogleMaps()
			.then(googleMaps => {
				this.googleMaps = googleMaps;
				const mapEl = this.mapElementRef.nativeElement;
				const map = new googleMaps.Map(mapEl, {
					center: this.center,
					zoom: 16,
					styles : [
						{
						  "elementType": "geometry",
						  "stylers": [
							{
							  "color": "#242f3e"
							}
						  ]
						},
						{
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#746855"
							}
						  ]
						},
						{
						  "elementType": "labels.text.stroke",
						  "stylers": [
							{
							  "color": "#242f3e"
							}
						  ]
						},
						{
						  "featureType": "administrative.locality",
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#d59563"
							}
						  ]
						},
						{
						  "featureType": "poi",
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#d59563"
							}
						  ]
						},
						{
						  "featureType": "poi.park",
						  "elementType": "geometry",
						  "stylers": [
							{
							  "color": "#263c3f"
							}
						  ]
						},
						{
						  "featureType": "poi.park",
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#6b9a76"
							}
						  ]
						},
						{
						  "featureType": "road",
						  "elementType": "geometry",
						  "stylers": [
							{
							  "color": "#38414e"
							}
						  ]
						},
						{
						  "featureType": "road",
						  "elementType": "geometry.stroke",
						  "stylers": [
							{
							  "color": "#212a37"
							}
						  ]
						},
						{
						  "featureType": "road",
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#9ca5b3"
							}
						  ]
						},
						{
						  "featureType": "road.highway",
						  "elementType": "geometry",
						  "stylers": [
							{
							  "color": "#746855"
							}
						  ]
						},
						{
						  "featureType": "road.highway",
						  "elementType": "geometry.stroke",
						  "stylers": [
							{
							  "color": "#1f2835"
							}
						  ]
						},
						{
						  "featureType": "road.highway",
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#f3d19c"
							}
						  ]
						},
						{
						  "featureType": "transit",
						  "elementType": "geometry",
						  "stylers": [
							{
							  "color": "#2f3948"
							}
						  ]
						},
						{
						  "featureType": "transit.station",
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#d59563"
							}
						  ]
						},
						{
						  "featureType": "water",
						  "elementType": "geometry",
						  "stylers": [
							{
							  "color": "#17263c"
							}
						  ]
						},
						{
						  "featureType": "water",
						  "elementType": "labels.text.fill",
						  "stylers": [
							{
							  "color": "#515c6d"
							}
						  ]
						},
						{
						  "featureType": "water",
						  "elementType": "labels.text.stroke",
						  "stylers": [
							{
							  "color": "#17263c"
							}
						  ]
						}
					  ]
				});

				this.googleMaps.event.addListenerOnce(map, 'idle', () => {
					this.renderer.addClass(mapEl, 'visible');
				});

				if (this.selectable) {
					this.clickListener = map.addListener('click', event => {
						const selectedCoords = {
							lat: event.latLng.lat(),
							lng: event.latLng.lng()
						};
						this.modalCtrl.dismiss(selectedCoords);
					});
				} else {
					 const marker = new googleMaps.Marker({
						 position: this.center,
						 map,
						 title: 'Picked Location'
					 });
					 marker.setMap(map);
				 }
			})
		.catch(err => {
			console.log(err);
		});
	}

	onCancel() {
		this.modalCtrl.dismiss();
	}

	ngOnDestroy() {
		if (this.clickListener) {
			this.googleMaps.event.removeListener(this.clickListener);
		}
	}

	private getGoogleMaps(): Promise<any> {
		const win = window as any;
		const googleModule = win.google;

		
		if (googleModule && googleModule.maps) {
			return Promise.resolve(googleModule.maps);
		}

		
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src =
				'https://maps.googleapis.com/maps/api/js?key=' +
				environment.googleMapsAPIKey;
			script.async = true;
			script.defer = true;
			document.body.appendChild(script);

			
			script.onload = () => {
				const loadedGoogleModule = win.google;
				if (loadedGoogleModule && loadedGoogleModule.maps) {
					resolve(loadedGoogleModule.maps);
				} else {
					reject ('Google Maps SDK not available');
				}
			};
		});
	}
}
