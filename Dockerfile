# Stage 1: Build the app
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

WORKDIR /app

# Copy project file and restore dependencies (NuGet packages)
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build & publish app
COPY . ./
RUN dotnet publish -c Release -o out

# Stage 2: Create runtime image
FROM mcr.microsoft.com/dotnet/aspnet:7.0

WORKDIR /app

# Copy published app from build stage
COPY --from=build /app/out ./

# Set entrypoint to run the app
ENTRYPOINT ["dotnet", "YourProjectName.dll"]
