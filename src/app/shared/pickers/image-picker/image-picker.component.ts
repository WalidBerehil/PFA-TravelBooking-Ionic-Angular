import { Component, OnInit, Output, EventEmitter, ElementRef, ViewChild, Input } from '@angular/core';
import { Plugins, Capacitor, CameraSource, CameraResultType } from '@capacitor/core';
import { Platform } from '@ionic/angular';

@Component({
	selector: 'app-image-picker',
	templateUrl: './image-picker.component.html',
	styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
	@ViewChild('filePicker') filePickerRef: ElementRef<HTMLInputElement>;
	@Output() imagePick = new EventEmitter<string | File>();
	@Input() showPreview = false;
	selectedImage: string;
	usePicker = false;

	constructor(private platform: Platform) { }

	ngOnInit() {

		if ((this.platform.is('mobile') && !this.platform.is('hybrid')) ||
			this.platform.is('desktop')
		) {
			this.usePicker = true;
		}
	}

	onPickImage() {
		if (!Capacitor.isPluginAvailable('Camera')) {
			this.filePickerRef.nativeElement.click();
			return;
		}
		Plugins.Camera
			.getPhoto({
				quality: 50,
				source: CameraSource.Prompt,
				correctOrientation: true,
				width: 200,
				resultType: CameraResultType.Base64
			})
			.then(image => {
				this.selectedImage = 'data:image/jpeg;base64,' + image.base64String;
				this.imagePick.emit(image.base64String);
			})
			.catch(error => {
				console.log(error);
				if (this.usePicker) {
					this.filePickerRef.nativeElement.click();
				}
				return false;
			});
	}

	onFileChosen(event: Event) {
		const pickedFile = (event.target as HTMLInputElement).files[0];
		if (!pickedFile) {
			return;
		}
		const fileReader = new FileReader();
		fileReader.onload = () => {
			const dataUrl = fileReader.result.toString();
			this.selectedImage = dataUrl;
			this.imagePick.emit(pickedFile);
		};
		fileReader.readAsDataURL(pickedFile);
	}
}
