from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import numpy as np
import io
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/generate-chart', methods=['POST'])
def generate_population_chart():
    try:
        # request.json.clear()  # Clear any previous JSON request data
        plt.close('all')


        data = request.json
        age_groups = data.get("age_groups", [])
        males = data.get("males", [])
        females = data.get("females", [])
        country_name = data.get("country", "Unknown Country")
        year = data.get("year", "Unknown Year")


        # 🔍 Debugging: Print extracted data
        print(f"Age Groups: {age_groups}")
        print(f"Male Population: {males}")
        print(f"Female Population: {females}")
        print(f"Country: {country_name}, Year: {year}")


        if not age_groups or not males or not females:
            return jsonify({"error": "Missing required data"}), 400

        

        fig, axes = plt.subplots(ncols=2, figsize=(11, 6), sharey=True, gridspec_kw={'wspace': 0.01})
        fig.tight_layout()
        axes[0].barh(age_groups, males, align='center', color='blue')
        axes[0].set_title('Male Population (total)')

        axes[1].barh(age_groups, females, align='center', color='red')
        axes[1].set_title('Female Population (total)')

        if axes[0].get_xlim()[1] > axes[1].get_xlim()[1]:
            axes[1].set_xlim(axes[0].get_xlim())
        else:
            axes[0].set_xlim(axes[1].get_xlim())

        
        axes[0].locator_params(axis='x', nbins=6)
        axes[1].locator_params(axis='x', nbins=6, prune='lower')
        axes[0].invert_xaxis()

        axes[0].set_ylabel('Age Groups')
        fig.suptitle(f"{country_name} {year}", y=0.95)

        # Save the figure locally for debugging
        debug_image_path = os.path.join(os.getcwd(), "debug_population_pyramid.png")
        try:
            plt.savefig(debug_image_path)
            print(f"✅ Debug image saved: {debug_image_path}")
        except Exception as e:
            print(f"❌ Warning: Could not save debug image - {e}")


        img = io.BytesIO()
        plt.savefig(img, format='png')
        plt.close(fig)
        img.seek(0)
        

        return send_file(img, mimetype='image/png')

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)