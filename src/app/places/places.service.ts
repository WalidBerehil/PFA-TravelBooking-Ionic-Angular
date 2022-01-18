import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { PlaceLocation } from './location.model';
import {environment} from '../../environments/environment';

interface PlaceData {
	availableFrom: string;
	availableTo: string;
	description: string;
	imageUrl: string;
	price: number;
	title: string;
	userId: string;
	location: PlaceLocation;
}


@Injectable({
	providedIn: 'root'
})
export class PlacesService {
	private _places = new BehaviorSubject<Place[]>([]);

	get places() {
		return this._places.asObservable();
	}

	constructor(private authService: AuthService, private http: HttpClient) { }

	fetchPlaces() {
		return this.authService.token.pipe(
			take(1),
			switchMap(token => {
				return this.http.get<{ [key: string]: PlaceData }>(
				`https://${environment.projectId}-default-rtdb.firebaseio.com/offered-places.json?auth=${token}`
				);
			}),
			map(resData => {
				const places = [];
				for (const key in resData) {
					if (resData.hasOwnProperty(key)) {
						places.push(
							new Place(
								key,
								resData[key].title,
								resData[key].description,
								resData[key].imageUrl,
								resData[key].price,
								new Date(resData[key].availableFrom),
								new Date(resData[key].availableTo),
								resData[key].userId,
								resData[key].location
							)
						);
					}
				}
				return places;
			}),
			tap(places => {
				this._places.next(places);
			})
		);
	}

	getPlace(id: string) {
		return this.authService.token.pipe(
			take(1), 
			switchMap(token => {
				return this.http.get<PlaceData>(
					`https://${environment.projectId}-default-rtdb.firebaseio.com/offered-places/${id}.json?auth=${token}`
				);
			}),
			map(placeData => {
				return new Place(
					id,
					placeData.title,
					placeData.description,
					placeData.imageUrl,
					placeData.price,
					new Date(placeData.availableFrom),
					new Date(placeData.availableTo),
					placeData.userId,
					placeData.location
				);
			})
		);
	}

	uploadImage(image: File) {
		const uploadData = new FormData();
		uploadData.append('image', image);

		return this.authService.token.pipe(
			take(1),
			switchMap(token => {
				return this.http.post<{ imageUrl: string; imagePath: string }>(
					'https://us-central1-'+environment.projectId+'.cloudfunctions.net/storeImage',
					uploadData, {headers: { Authorization: 'Bearer ' + token } }
				);
			})
		);
	}

	addPlace(
		title: string,
		description: string,
		price: number,
		dateFrom: Date,
		dateTo: Date,
		location: PlaceLocation,
		imageUrl: string
	) {
		let generatedId: string;
		let fetchedUserId: string;
		let newPlace: Place;
		return this.authService.userId.pipe(
			take(1),
			switchMap(userId => {
				fetchedUserId = userId;
				return this.authService.token;
			}),
			take(1),
			switchMap(token => {
				if (!fetchedUserId) {
					throw new Error('No user found');
				}
				newPlace = new Place
				(
					Math.random().toString(),
					title,
					description,
					imageUrl,
					price,
					dateFrom,
					dateTo,
					fetchedUserId,
					location
				);
				
				return this.http
					.post<{name: string}>(
						`https://${environment.projectId}-default-rtdb.firebaseio.com/offered-places.json?auth=${token}`,
						{
							...newPlace,
							id: null
						}
					);
			}),
				switchMap(resData => {
					generatedId = resData.name;
					return this.places;
				}),
				take(1),
				tap(places => {
					newPlace.id = generatedId;
					this._places.next(places.concat(newPlace));
				})
			);
		
	}

	updatePlace(placeId: string, title: string, description: string) {
		let updatedPlaces: Place[];
		let fetchedToken: string;
		return this.authService.token.pipe(
			take(1),
			switchMap(token => {
				fetchedToken = token;
				return this.places;
			}),
			take(1),
			switchMap(places => {
				if (!places || places.length <= 0) {
					return this.fetchPlaces();
				} else {
					return of(places);
				}
			}),
			switchMap(places => {
				const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
				updatedPlaces = [...places];
				const oldPlace = updatedPlaces[updatedPlaceIndex];
				updatedPlaces[updatedPlaceIndex] = new Place(
					oldPlace.id,
					title,
					description,
					oldPlace.imageUrl,
					oldPlace.price,
					oldPlace.availableFrom,
					oldPlace.availableTo,
					oldPlace.userId,
					oldPlace.location
				);
				return this.http.put(
					`https://${environment.projectId}-default-rtdb.firebaseio.com/offered-places/${placeId}.json?auth=${fetchedToken}`,
					{ ...updatedPlaces[updatedPlaceIndex], id: null }
				);
			}),
			tap(() => {
				this._places.next(updatedPlaces);
			}),
		);
	}

	cancelPlace(placeId: string) {
		return this.authService.token.pipe(
			take(1),
			switchMap(token => {
				return this.http
					.delete(
						`https://${environment.projectId}-default-rtdb.firebaseio.com/offered-places/${placeId}.json?auth=${token}`
					);
			}),
			switchMap(() => {
				return this.places;
			}),
			take(1),
			tap(places => {
				this._places.next(places.filter(b => b.id !== placeId));
			})
		);
	}
}
