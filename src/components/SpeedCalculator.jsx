import React, { useState, useEffect, useRef } from "react";
import { Globe2, Navigation, Plane, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CONSTANTS = {
	PLANE_SPEED: 550, // mph (aircraft true speed)
	EARTH_RADIUS: 3959, // miles (average radius of Earth)
};

const calculateApparentSpeed = (latitude) => {
	const latRad = (latitude * Math.PI) / 180;
	const circumferenceAtLatitude =
		2 * Math.PI * CONSTANTS.EARTH_RADIUS * Math.cos(latRad);
	const distancePerDegree = circumferenceAtLatitude / 360;
	const degreesPerHour = CONSTANTS.PLANE_SPEED / distancePerDegree;
	const degreesPerSecond = degreesPerHour / 3600;
	const circumferenceAtEquator = 2 * Math.PI * CONSTANTS.EARTH_RADIUS;
	const distancePerDegreeEquator = circumferenceAtEquator / 360;
	const degreesPerHourEquator =
		CONSTANTS.PLANE_SPEED / distancePerDegreeEquator;
	const degreesPerSecondEquator = degreesPerHourEquator / 3600;
	const percentageIncrease =
		((degreesPerSecond - degreesPerSecondEquator) / degreesPerSecondEquator) *
		100;

	return {
		latitude,
		circumferenceAtLatitude,
		distancePerDegree,
		degreesPerHour,
		degreesPerSecond,
		percentageIncrease,
	};
};

const GlobeVisualization = ({ latitude }) => {
	const canvasRef = useRef(null);
	const [rotation, setRotation] = useState(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		const width = canvas.width;
		const height = canvas.height;

		let animationFrameId;

		const drawGlobe = () => {
			ctx.clearRect(0, 0, width, height);

			// Enhanced 3D Effect: Background glow
			const bgGradient = ctx.createRadialGradient(
				width / 2,
				height / 2,
				50,
				width / 2,
				height / 2,
				150
			);
			bgGradient.addColorStop(0, "#eef2ff");
			bgGradient.addColorStop(1, "#6366f1");
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, width, height);

			// Globe with radial gradient for depth
			const globeGradient = ctx.createRadialGradient(
				width / 2 - 30,
				height / 2 - 30,
				50,
				width / 2,
				height / 2,
				100
			);
			globeGradient.addColorStop(0, "#dbeafe");
			globeGradient.addColorStop(1, "#3b82f6");
			ctx.beginPath();
			ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
			ctx.fillStyle = globeGradient;
			ctx.fill();

			// Enhanced grid lines
			ctx.save();
			ctx.translate(width / 2, height / 2);
			ctx.rotate(rotation);
			ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
			ctx.lineWidth = 1;
			for (let i = 0; i < 24; i++) {
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(0, -100);
				ctx.stroke();
				ctx.rotate((Math.PI * 2) / 24);
			}
			ctx.restore();

			// Latitude lines with variable opacity based on position
			for (let i = -8; i <= 8; i++) {
				const latAngle = (i * Math.PI) / 16;
				const radius = 100 * Math.cos(latAngle);
				if (radius >= 0) {
					ctx.beginPath();
					ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
					const opacity = 0.1 + 0.1 * (1 - Math.abs(i) / 8);
					ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
					ctx.stroke();
				}
			}

			// Equator line with glow effect
			ctx.beginPath();
			ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
			ctx.strokeStyle = "#ffffff80";
			ctx.lineWidth = 2;
			ctx.shadowBlur = 5;
			ctx.shadowColor = "#ffffff";
			ctx.stroke();
			ctx.shadowBlur = 0; // Reset shadow

			// Selected latitude line with enhanced visibility
			const latRad = (latitude * Math.PI) / 180;
			const latRadius = 100 * Math.cos(latRad);
			if (latRadius >= 0) {
				ctx.beginPath();
				ctx.arc(width / 2, height / 2, latRadius, 0, Math.PI * 2);
				ctx.strokeStyle = "#10b981";
				ctx.lineWidth = 2;
				ctx.stroke();
			}

			// Draw planes with motion trails
			const drawPlaneWithTrail = (x, y, color) => {
				// Motion trail
				ctx.save();
				ctx.globalAlpha = 0.3;
				ctx.strokeStyle = color;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(width / 2, height / 2);
				ctx.lineTo(x, y);
				ctx.stroke();
				ctx.restore();

				// Plane
				ctx.save();
				ctx.translate(x, y);
				ctx.rotate(rotation + Math.PI / 2);
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.moveTo(0, -6);
				ctx.lineTo(4, 6);
				ctx.lineTo(-4, 6);
				ctx.closePath();
				ctx.fill();
				ctx.restore();
			};

			// Equator plane
			const equatorPlaneX = width / 2 + Math.cos(rotation) * 100;
			const equatorPlaneY = height / 2 + Math.sin(rotation) * 100;
			drawPlaneWithTrail(equatorPlaneX, equatorPlaneY, "#3b82f6");

			// Latitude plane
			if (latRadius >= 0) {
				const latitudePlaneX = width / 2 + Math.cos(rotation) * latRadius;
				const latitudePlaneY = height / 2 + Math.sin(rotation) * latRadius;
				drawPlaneWithTrail(latitudePlaneX, latitudePlaneY, "#10b981");
			}
		};

		const animate = () => {
			drawGlobe();
			setRotation((prev) => (prev + 0.01) % (Math.PI * 2));
			animationFrameId = requestAnimationFrame(animate);
		};

		animate();

		return () => cancelAnimationFrame(animationFrameId);
	}, [latitude]);

	return (
		<canvas
			ref={canvasRef}
			width={400}
			height={300}
			className="w-full h-auto bg-white/50 rounded-xl shadow-inner"
		/>
	);
};

const SpeedComparison = ({ percentageIncrease }) => {
	const [equatorPosition, setEquatorPosition] = useState(0);
	const [latitudePosition, setLatitudePosition] = useState(0);

	useEffect(() => {
		let animationFrameId;
		const baseSpeed = 0.02;
		const adjustedSpeed = baseSpeed * (1 + percentageIncrease / 100);

		const animate = () => {
			setEquatorPosition((prev) => (prev + baseSpeed) % 100);
			setLatitudePosition((prev) => (prev + adjustedSpeed) % 100);
			animationFrameId = requestAnimationFrame(animate);
		};

		animationFrameId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationFrameId);
	}, [percentageIncrease]);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Info className="w-4 h-4 text-gray-500" />
				<span className="text-sm text-gray-600">
					Angular Speed Comparison (constant {CONSTANTS.PLANE_SPEED} mph)
				</span>
			</div>

			<div className="space-y-4">
				<div className="relative h-16 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl overflow-hidden shadow-inner">
					<div className="absolute inset-y-0 left-4 flex items-center">
						<span className="text-sm font-medium bg-white/80 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
							Equator Motion
						</span>
					</div>
					<div
						className="absolute top-1/2 transform -translate-y-1/2"
						style={{ left: `${equatorPosition}%` }}
					>
						<Plane className="w-8 h-8 text-blue-600 transform -rotate-12" />
					</div>
				</div>

				<div className="relative h-16 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl overflow-hidden shadow-inner">
					<div className="absolute inset-y-0 left-4 flex items-center">
						<span className="text-sm font-medium bg-white/80 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
							Latitude Motion (+{percentageIncrease.toFixed(1)}%)
						</span>
					</div>
					<div
						className="absolute top-1/2 transform -translate-y-1/2"
						style={{ left: `${latitudePosition}%` }}
					>
						<Plane className="w-8 h-8 text-emerald-600 transform -rotate-12" />
					</div>
				</div>
			</div>
		</div>
	);
};

const SpeedCalculator = () => {
	const [city, setCity] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!city.trim()) return;

		setLoading(true);
		setError("");

		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
					city
				)}&format=json&limit=1`
			);

			if (!response.ok) throw new Error("Network response was not ok");

			const data = await response.json();

			if (data && data.length > 0) {
				const latitude = parseFloat(data[0].lat);
				const calculations = calculateApparentSpeed(Math.abs(latitude));
				setResult({
					cityName: data[0].display_name.split(",")[0],
					latitude: latitude,
					...calculations,
				});
			} else {
				setError("City not found. Please try another location.");
			}
		} catch (err) {
			setError("Error looking up location. Please try again.");
			console.error("Submit error:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-3xl mx-auto p-8">
			<div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-lg p-8 space-y-8">
				<div className="flex items-center gap-4 border-b border-gray-100 pb-6">
					<div className="bg-indigo-100 p-3 rounded-xl">
						<Globe2 className="w-8 h-8 text-indigo-600" />
					</div>
					<div>
						<h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
							Do planes fly faster at the poles? Let's find out.
						</h1>
						<p className="text-gray-600">
							Type in the name of your city and explore how latitude affects
							apparent motion while maintaining constant linear speed.
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="relative">
					<Input
						type="text"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						placeholder="Enter city name..."
						disabled={loading}
						className="w-full h-12 pl-12 pr-32 rounded-xl shadow-sm"
					/>
					<Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<Button
						type="submit"
						disabled={loading || !city.trim()}
						className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg h-8"
					>
						{loading ? "Calculating..." : "Calculate"}
					</Button>
				</form>

				{error && (
					<div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
						<div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
						{error}
					</div>
				)}

				{result && (
					<div className="space-y-6">
						<Card className="bg-white/50 backdrop-blur-sm">
							<CardContent className="pt-6">
								<div className="flex items-center gap-3 mb-6">
									<Navigation className="w-5 h-5 text-indigo-600" />
									<h2 className="text-xl font-semibold text-gray-800">
										Results for {result.cityName}
									</h2>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div className="space-y-4">
										<h3 className="font-semibold text-gray-700 flex items-center gap-2">
											<span className="w-2 h-2 bg-indigo-600 rounded-full" />
											Location Details
										</h3>
										<div className="space-y-2 text-gray-600">
											<p className="flex justify-between">
												<span>Latitude</span>
												<span className="font-mono">
													{result.latitude.toFixed(2)}°
												</span>
											</p>
											<p className="flex justify-between">
												<span>Earth's Circumference</span>
												<span className="font-mono">
													{result.circumferenceAtLatitude.toFixed(0)} mi
												</span>
											</p>
											<p className="flex justify-between">
												<span>Miles per Degree</span>
												<span className="font-mono">
													{result.distancePerDegree.toFixed(2)} mi
												</span>
											</p>
										</div>
									</div>

									<div className="space-y-4">
										<h3 className="font-semibold text-gray-700 flex items-center gap-2">
											<span className="w-2 h-2 bg-purple-600 rounded-full" />
											Angular Speed Analysis
										</h3>
										<div className="space-y-2 text-gray-600">
											<p className="flex justify-between">
												<span>Degrees/Hour</span>
												<span className="font-mono">
													{result.degreesPerHour.toFixed(2)}°/hr
												</span>
											</p>
											<p className="flex justify-between">
												<span>Degrees/Second</span>
												<span className="font-mono">
													{result.degreesPerSecond.toFixed(5)}°/sec
												</span>
											</p>
											<p className="flex justify-between">
												<span>Speed Increase</span>
												<span className="font-mono text-emerald-600">
													+{result.percentageIncrease.toFixed(2)}%
												</span>
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card className="bg-white">
								<CardContent className="pt-6">
									<h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
										<span className="w-2 h-2 bg-indigo-600 rounded-full" />
										3D Globe Visualization
									</h3>
									<GlobeVisualization latitude={result.latitude} />
									<p className="text-sm text-gray-600 mt-4">
										Visualization shows how the same linear speed creates
										different angular velocities at the equator (blue) versus
										selected latitude (green).
									</p>
								</CardContent>
							</Card>

							<Card className="bg-white">
								<CardContent className="pt-6">
									<h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
										<span className="w-2 h-2 bg-purple-600 rounded-full" />
										Linear vs Angular Speed
									</h3>
									<SpeedComparison
										percentageIncrease={result.percentageIncrease}
									/>
									<p className="text-sm text-gray-600 mt-4">
										While both planes maintain {CONSTANTS.PLANE_SPEED} mph, the
										higher latitude results in faster angular motion due to the
										smaller circumference.
									</p>
								</CardContent>
							</Card>
						</div>

						<div className="bg-gray-50 rounded-xl p-6 space-y-4">
							<div className="prose prose-sm max-w-none">
								<h3 className="text-lg font-semibold text-gray-800 mb-3">
									Understanding the Results
								</h3>

								<div className="space-y-4">
									<div className="bg-white rounded-lg p-4 shadow-sm">
										<h4 className="font-medium text-gray-800 mb-2">
											Key Concepts
										</h4>
										<ul className="space-y-2 text-gray-600">
											<li className="flex items-start gap-2">
												<span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
												<span>
													<strong>Linear Speed:</strong> Remains constant at{" "}
													{CONSTANTS.PLANE_SPEED} mph regardless of latitude
												</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2" />
												<span>
													<strong>Angular Speed:</strong> Increases at higher
													latitudes due to Earth's smaller circumference
												</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2" />
												<span>
													<strong>Apparent Motion:</strong> Aircraft appears to
													move faster across the sky at higher latitudes
												</span>
											</li>
										</ul>
									</div>

									<div className="bg-white rounded-lg p-4 shadow-sm">
										<h4 className="font-medium text-gray-800 mb-2">
											Assumptions
										</h4>
										<ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
											<li className="flex items-center gap-2">
												<span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
												Aircraft speed: {CONSTANTS.PLANE_SPEED} mph
											</li>
											<li className="flex items-center gap-2">
												<span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
												East-west flight path
											</li>
											<li className="flex items-center gap-2">
												<span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
												Stationary ground observer
											</li>
											<li className="flex items-center gap-2">
												<span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
												Spherical Earth model
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default SpeedCalculator;
