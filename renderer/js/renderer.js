

const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

let file;

const isFileImage = (file) => {
  const acceptedFileTypes = ['image/gif', 'image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
  return file && acceptedFileTypes.includes(file.type);
};

const alertError = (message) => {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'red',
      color: 'white',
      textAlign: 'center',
    },
  });
};

const alertSuccess = (message) => {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'green',
      color: 'white',
      textAlign: 'center',
    },
  });
};

const sendImage = (e) => {
  e.preventDefault();
  file = img.files[0];

  if (!file) {
    alertError('Please upload an image!');
    return;
  }

  const width = widthInput.value;
  const height = heightInput.value;

  // Use a FileReader to read the file as a data URL
  const reader = new FileReader();
  reader.onload = function(event) {
    const imagePath = event.target.result; // Data URL of the image file

    if (width === '' || height === '') {
      alertError('Please fill in width and height!');
      return;
    }

    // Send the data URL to the main process
    ipcRenderer.send('image:resize', { imagePath, width, height });
  };

  // Read the file as a data URL
  reader.readAsDataURL(file);

  ipcRenderer.on('image:done',() =>{
    alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`);
  })
};

const loadImage = (e) => {
  file = e.target.files[0];

  if (!isFileImage(file)) {
    alertError('Please select a valid image file!');
    return;
  }

  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = () => {
    heightInput.value = image.height;
    widthInput.value = image.width;
  };

  form.style.display = 'block';
  filename.innerText = file.name;
  outputPath.innerText = 'File loaded'; // You might want to handle the output path differently
  alertSuccess('Image successfully loaded!');
};

img.addEventListener('change', loadImage);
form.addEventListener('submit', sendImage);
