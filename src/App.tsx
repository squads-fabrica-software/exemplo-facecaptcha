import Axios from 'axios';
import React from 'react';
import Camera, { FACING_MODES, IMAGE_TYPES } from 'react-html5-camera-photo';
import ChallengeResult from './entities/ChallengeResult';

interface ImageChallenge {
  index: number;
  mensagem: string;
  codigo: string;
  emoji: string;
  imagem?: string;
}

interface ImageRequest {
  codigo: string,
  image: string
}

type MyProps = { };
type MyState = {
  msg: string,
  challengeResult: ChallengeResult,
  challenges: ImageChallenge[],
  sleepTime: number,
  snapNumber: number,
  currentImageChallenge: ImageChallenge
};
class App extends React.Component<MyProps, MyState> {
  private url = 'http://localhost:3333/v1/authenticity/information/facecaptcha';
  constructor(props: any) {
    super(props);
    this.state = {
      msg: '',
      challengeResult: {} as ChallengeResult,
      challenges: [],
      sleepTime: 0,
      snapNumber: 0,
      currentImageChallenge: {} as ImageChallenge
    };
  }

  async componentWillMount() {
    await this.getChallenge();
  }

  handleData(data: string) {
    this.setState({msg: data});
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row justify-content-md-center">
          <label>{this.state.msg}</label>
        </div>
        
        {this.state.currentImageChallenge && this.state.currentImageChallenge.codigo &&
          <div>
            <div className="row justify-content-md-center">
              <div className="col-4 text-center">
                <img src={'data:image/png;base64,' + this.state.currentImageChallenge.mensagem} ></img>
              </div>
            </div>
            <div className="row justify-content-md-center">
              <div className="col-4 text-center">
                <img src={'data:image/png;base64,' + this.state.currentImageChallenge.emoji} ></img>
              </div>
            </div>
            <div className="row justify-content-md-center">
              <div className="col-4 text-center">
                <Camera
                  imageType={IMAGE_TYPES.JPG}
                  idealFacingMode={FACING_MODES.ENVIRONMENT}
                  onTakePhoto = { (dataUri: string) => { this.takePhoto(dataUri); } }
                />
              </div>
            </div>
          </div>        
        }
      </div>      
    );
  }

  private async getChallenge() {
    const response = await Axios.get(this.url);
    const challengeResult = response.data as ChallengeResult;
    let imageChallenges: ImageChallenge[] = [];
    let index = 1;
    challengeResult.challenges.forEach(challenge => {
      for (let i = 0; i < challengeResult.snapNumber; i++) {
        let imageChallenge = {
          index: index,
          mensagem: challenge.mensagem,
          codigo: challenge.tipoFace.codigo,
          emoji: challenge.tipoFace.imagem,
        }
        imageChallenges.push(imageChallenge);
        index++;
      }
    });
    
    const currentImageChallenge = imageChallenges[0];

    this.setState({
      challengeResult,
      challenges: imageChallenges,
      sleepTime: challengeResult.snapFrequenceInMillis,
      snapNumber: challengeResult.snapNumber,
      currentImageChallenge
    });
    this.waitTime();
  }

  private async waitTime() {
    await new Promise(resolve => setTimeout(resolve, this.state.sleepTime));
    this.takePhotoAutomatically();
  }

  private takePhotoAutomatically() {
    const takePhotoBtn = document.getElementById("outer-circle");
    if (takePhotoBtn) {
      takePhotoBtn.click();
    }
  };

  private async takePhoto(dataUri: string) {
    let challenges: ImageChallenge[] = [];
    const index = this.state.currentImageChallenge.index;
    let current = {} as ImageChallenge;
    this.state.challenges.forEach(data => {
      if (data.index === index) {
        const challenge:ImageChallenge = {
          index: data.index,
          mensagem: data.mensagem,
          codigo: data.codigo,
          emoji: data.emoji,
          imagem: dataUri.split('data:image/jpeg;base64,')[1]
        }
        challenges.push(challenge);
      } else {
        challenges.push(data);
        if (data.index === this.state.currentImageChallenge.index + 1) {
          current = data;
        }
      }
    })
    this.setState({challenges}, async () => {
      if (current.codigo) {
        this.setState({currentImageChallenge: current})
        this.waitTime();
      } else {
        await this.captcha();
      }
    });
    
  }

  private async captcha() {
    let images: ImageRequest[] = [];
    this.state.challenges.forEach(challenge => {
      const image: ImageRequest = {
        codigo: challenge.codigo,
        image: challenge.imagem as string,
      };
      images.push(image);
    });
    const response = await Axios.post(this.url, images);
    console.log(response);
  }
}

export default App;
