class WeatherInfo {
  #day: string = "";
  #temp_min: number = -999;
  #temp_max: number = -999;
  #prec_max: number = -999;

  constructor(
    day: string,
    temp_min: number,
    temp_max: number,
    prec_max: number,
  ) {
    this.#day = day;
    this.#temp_min = temp_min;
    this.#temp_max = temp_max;
    this.#prec_max = prec_max;
  }

  output(): string {
    return `date: ${this.#day}, 最低気温: ${this.#temp_min}, 最高気温: ${this.#temp_max}, 降水確立: ${this.#prec_max}`;
  }
}

class WeatherInfoManager {
  #week: WeatherInfo[] = [];
  constructor() {}

  add_weather_info(
    day: string,
    temp_min: number,
    temp_max: number,
    prec_max: number,
  ) {
    this.#week.push(new WeatherInfo(day, temp_min, temp_max, prec_max));
  }

  view_weather_info_in_week() {
    for (var info of this.#week) {
      console.log(info.output());
    }
  }
}

class WeatherApi {
  constructor() {}
  async get_weather(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Http Error. Status : ${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        throw new Error(`Failed to Recieved Json Data`);
      }

      const weather_manager = new WeatherInfoManager();

      var index = 0;
      var day = data["daily"];
      for (var time of day["time"]) {
        const temp_mins = day["temperature_2m_min"];
        const temp_maxs = day["temperature_2m_max"];
        const prec_maxs = day["precipitation_probability_max"];
        weather_manager.add_weather_info(
          time,
          temp_mins[index],
          temp_maxs[index],
          prec_maxs[index],
        );
        index++;
      }

      weather_manager.view_weather_info_in_week();
    } catch (error) {
      console.error("Connection Error : ", error);
    }
  }
}

interface NominatimResult {
  place_id: number;
  licence: string;
  lat: string;
  lon: string;
  display_name: string;
}

class NominatimApi {
  constructor() {}

  async get_geocoding(
    city_name: string,
  ): Promise<{ lat: number; lon: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city_name)}&format=json&limit=1`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "MyWeatherApp/1.0 (contact: rmt0916@icloud.com)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error. status: ${response.status}`);
      }

      const datas = (await response.json()) as NominatimResult[];

      if (datas.length > 0) {
        var data = datas[0] as NominatimResult;
        console.log(data);
        return {
          lat: parseFloat(data.lat),
          lon: parseFloat(data.lon),
        };
      } else {
        console.log("Not found location.");
        return null;
      }
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }
}

const weather_api = new WeatherApi();
const geocoding_api = new NominatimApi();

// 取得自体はできているが、なぜかvalに持ってくるとPendingとなる

// NOTE:get_geocoding関数がawaitで待つ処理を入れずに呼んでいたからPendingになっていた
// awaitで待つことで期待通りの値が取得できた。
(async () => {
  var val = await geocoding_api.get_geocoding("福岡");
  if (val != null) {
    console.log(val);

    weather_api.get_weather(
      `https://api.open-meteo.com/v1/forecast?latitude=${val.lat}&longitude=${val.lon}&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max&hourly=temperature_2m,precipitation_probability&current=temperature_2m,precipitation&timezone=Asia%2FTokyo`,
    );
  }
})();
