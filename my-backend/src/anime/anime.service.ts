import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Series, SeriesDocument } from './schemas/series.schema';
import { Episode, EpisodeDocument } from './schemas/episode.schema';
import { WatchHistory, WatchHistoryDocument } from './schemas/watch-history.schema';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { Playlist, PlaylistDocument } from './schemas/playlist.schema';
import { PlaylistItem, PlaylistItemDocument } from './schemas/playlist-item.schema';
import { CreateSeriesDto } from './dto/create-series.dto';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Injectable()
export class AnimeService {
  constructor(
    @InjectModel(Series.name) private seriesModel: Model<SeriesDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(WatchHistory.name) private watchHistoryModel: Model<WatchHistoryDocument>,
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
    @InjectModel(PlaylistItem.name) private playlistItemModel: Model<PlaylistItemDocument>,
  ) {}

  async createSeries(dto: CreateSeriesDto, userId: string): Promise<SeriesDocument> {
    const validCategories = ['Anime', 'Romance', 'Animation', 'Action', 'Adventure', 'Fantasy', 'Love', 'Romantic', 'Horror', 'Mystery'];
    const invalidCategories = dto.categories.filter(c => !validCategories.includes(c));
    if (invalidCategories.length > 0) {
      throw new BadRequestException(`Invalid categories: ${invalidCategories.join(', ')}`);
    }

    const series = new this.seriesModel({
      ...dto,
      uploadedBy: new Types.ObjectId(userId),
    });
    return series.save();
  }

  async findAllSeries(query?: { search?: string; category?: string }): Promise<SeriesDocument[]> {
    const filter: any = {};
    if (query?.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query?.category) {
      filter.categories = query.category;
    }
    return this.seriesModel.find(filter).populate('uploadedBy', 'name username').sort({ createdAt: -1 }).exec();
  }

  async getCategories(): Promise<string[]> {
    const series = await this.seriesModel.find().distinct('categories').exec();
    const validCategories = ['Anime', 'Romance', 'Animation', 'Action', 'Adventure', 'Fantasy', 'Love', 'Romantic', 'Horror', 'Mystery'];
    return validCategories.filter(cat => series.includes(cat));
  }

  async findSeriesById(id: string): Promise<SeriesDocument> {
    const series = await this.seriesModel.findById(id).populate('uploadedBy', 'name username').exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }
    return series;
  }

  async updateSeries(id: string, dto: UpdateSeriesDto, userId: string, userRole: string): Promise<SeriesDocument> {
    const series = await this.seriesModel.findById(id).exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    if (userRole !== 'super_admin' && series.uploadedBy.toString() !== userId) {
      throw new ForbiddenException('You can only update your own series');
    }

    if (dto.categories) {
      const validCategories = ['Anime', 'Romance', 'Animation', 'Action', 'Adventure', 'Fantasy', 'Love', 'Romantic', 'Horror', 'Mystery'];
      const invalidCategories = dto.categories.filter(c => !validCategories.includes(c));
      if (invalidCategories.length > 0) {
        throw new BadRequestException(`Invalid categories: ${invalidCategories.join(', ')}`);
      }
    }

    Object.assign(series, dto);
    return series.save();
  }

  async deleteSeries(id: string, userId: string, userRole: string): Promise<void> {
    const series = await this.seriesModel.findById(id).exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    if (userRole !== 'super_admin' && series.uploadedBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own series');
    }

    await this.seriesModel.findByIdAndDelete(id).exec();
    await this.episodeModel.deleteMany({ seriesId: new Types.ObjectId(id) }).exec();
    await this.favoriteModel.deleteMany({ seriesId: new Types.ObjectId(id) }).exec();
    const playlists = await this.playlistModel.find({ userId: new Types.ObjectId(userId) }).exec();
    const playlistIds = playlists.map(p => p._id);
    await this.playlistItemModel.deleteMany({ playlistId: { $in: playlistIds } }).exec();
    await this.watchHistoryModel.deleteMany({ seriesId: new Types.ObjectId(id) }).exec();
  }

  async createEpisode(dto: CreateEpisodeDto, userId: string): Promise<EpisodeDocument> {
    const series = await this.seriesModel.findById(dto.seriesId).exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    let episodeNumber = dto.episodeNumber;

    if (!episodeNumber) {
      const lastEpisode = await this.episodeModel
        .findOne({ seriesId: new Types.ObjectId(dto.seriesId), seasonNumber: dto.seasonNumber })
        .sort({ episodeNumber: -1 })
        .exec();
      episodeNumber = lastEpisode ? lastEpisode.episodeNumber + 1 : 1;
    }

    const episode = new this.episodeModel({
      ...dto,
      episodeNumber,
      uploadedBy: new Types.ObjectId(userId),
    });
    return episode.save();
  }

  async findEpisodesBySeries(seriesId: string): Promise<EpisodeDocument[]> {
    return this.episodeModel
      .find({ seriesId: new Types.ObjectId(seriesId) })
      .populate('uploadedBy', 'name username')
      .sort({ seasonNumber: 1, episodeNumber: 1 })
      .exec();
  }

  async updateEpisode(id: string, dto: UpdateEpisodeDto, userId: string): Promise<EpisodeDocument> {
    const episode = await this.episodeModel.findById(id).exec();
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    Object.assign(episode, dto);
    return episode.save();
  }

  async deleteEpisode(id: string, userId: string, userRole: string): Promise<void> {
    const episode = await this.episodeModel.findById(id).exec();
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    if (userRole !== 'super_admin' && episode.uploadedBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own episodes');
    }

    await this.episodeModel.findByIdAndDelete(id).exec();
    await this.watchHistoryModel.deleteMany({ episodeId: new Types.ObjectId(id) }).exec();
  }

  async incrementViews(episodeId: string): Promise<EpisodeDocument> {
    const episode = await this.episodeModel.findByIdAndUpdate(
      episodeId,
      { $inc: { views: 1 } },
      { new: true },
    ).exec();
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }
    return episode;
  }

  async addToFavorites(userId: string, seriesId: string): Promise<FavoriteDocument> {
    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    const existing = await this.favoriteModel.findOne({
      userId: new Types.ObjectId(userId),
      seriesId: new Types.ObjectId(seriesId),
    }).exec();

    if (existing) {
      throw new BadRequestException('Series already in favorites');
    }

    const favorite = new this.favoriteModel({
      userId: new Types.ObjectId(userId),
      seriesId: new Types.ObjectId(seriesId),
    });
    return favorite.save();
  }

  async removeFromFavorites(userId: string, seriesId: string): Promise<void> {
    const result = await this.favoriteModel.deleteOne({
      userId: new Types.ObjectId(userId),
      seriesId: new Types.ObjectId(seriesId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Favorite not found');
    }
  }

  async getFavorites(userId: string): Promise<any[]> {
    const favorites = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    const seriesIds = favorites.map(f => f.seriesId);
    const seriesList = await this.seriesModel.find({ _id: { $in: seriesIds } }).exec();
    const seriesMap = new Map(seriesList.map(s => [s._id.toString(), s]));

    return favorites.map(f => ({
      ...f.toObject(),
      series: seriesMap.get(f.seriesId.toString()),
    }));
  }

  async createPlaylist(userId: string, dto: CreatePlaylistDto): Promise<PlaylistDocument> {
    const playlist = new this.playlistModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    return playlist.save();
  }

  async findPlaylistsByUser(userId: string): Promise<PlaylistDocument[]> {
    return this.playlistModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async addToPlaylist(playlistId: string, seriesId: string, userId: string): Promise<PlaylistItemDocument> {
    const playlist = await this.playlistModel.findById(playlistId).exec();
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId.toString() !== userId) {
      throw new ForbiddenException('You can only add to your own playlists');
    }

    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    const existing = await this.playlistItemModel.findOne({
      playlistId: new Types.ObjectId(playlistId),
      seriesId: new Types.ObjectId(seriesId),
    }).exec();

    if (existing) {
      throw new BadRequestException('Series already in playlist');
    }

    const item = new this.playlistItemModel({
      playlistId: new Types.ObjectId(playlistId),
      seriesId: new Types.ObjectId(seriesId),
    });
    return item.save();
  }

  async removeFromPlaylist(playlistId: string, seriesId: string, userId: string): Promise<void> {
    const playlist = await this.playlistModel.findById(playlistId).exec();
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId.toString() !== userId) {
      throw new ForbiddenException('You can only remove from your own playlists');
    }

    const result = await this.playlistItemModel.deleteOne({
      playlistId: new Types.ObjectId(playlistId),
      seriesId: new Types.ObjectId(seriesId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Item not found in playlist');
    }
  }

  async getPlaylistItems(playlistId: string, userId: string): Promise<any[]> {
    const playlist = await this.playlistModel.findById(playlistId).exec();
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId.toString() !== userId) {
      throw new ForbiddenException('You can only view your own playlists');
    }

    const items = await this.playlistItemModel
      .find({ playlistId: new Types.ObjectId(playlistId) })
      .sort({ addedAt: -1 })
      .exec();

    const seriesIds = items.map(i => i.seriesId);
    const seriesList = await this.seriesModel.find({ _id: { $in: seriesIds } }).exec();
    const seriesMap = new Map(seriesList.map(s => [s._id.toString(), s]));

    return items.map(i => ({
      ...i.toObject(),
      series: seriesMap.get(i.seriesId.toString()),
    }));
  }

  async addWatchHistory(userId: string, episodeId: string, seriesId: string, progress: number = 0): Promise<WatchHistoryDocument> {
    const episode = await this.episodeModel.findById(episodeId).exec();
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    const existing = await this.watchHistoryModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        episodeId: new Types.ObjectId(episodeId),
      },
      {
        userId: new Types.ObjectId(userId),
        episodeId: new Types.ObjectId(episodeId),
        seriesId: new Types.ObjectId(seriesId),
        watchedAt: new Date(),
        progress,
      },
      { upsert: true, new: true },
    ).exec();

    return existing;
  }

  async getWatchHistory(userId: string): Promise<any[]> {
    const history = await this.watchHistoryModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ watchedAt: -1 })
      .exec();

    const episodeIds = history.map(h => h.episodeId);
    const seriesIds = history.map(h => h.seriesId);

    const episodes = await this.episodeModel.find({ _id: { $in: episodeIds } }).exec();
    const seriesList = await this.seriesModel.find({ _id: { $in: seriesIds } }).exec();

    const episodeMap = new Map(episodes.map(e => [e._id.toString(), e]));
    const seriesMap = new Map(seriesList.map(s => [s._id.toString(), s]));

    return history.map(h => ({
      ...h.toObject(),
      episode: episodeMap.get(h.episodeId.toString()),
      series: seriesMap.get(h.seriesId.toString()),
    }));
  }

  async updateWatchHistory(id: string, progress: number, userId: string): Promise<WatchHistoryDocument> {
    const history = await this.watchHistoryModel.findById(id).exec();
    if (!history) {
      throw new NotFoundException('Watch history not found');
    }

    if (history.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own watch history');
    }

    history.progress = progress;
    history.watchedAt = new Date();
    return history.save();
  }

  async deletePlaylist(id: string, userId: string): Promise<void> {
    const playlist = await this.playlistModel.findById(id).exec();
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own playlists');
    }

    await this.playlistItemModel.deleteMany({ playlistId: new Types.ObjectId(id) }).exec();
    await this.playlistModel.findByIdAndDelete(id).exec();
  }

  async bulkCreateEpisodes(
    seriesId: string,
    seasonNumber: number,
    episodes: Array<{ episodeNumber: number; videoUrl: string; thumbnailUrl?: string }>,
    userId: string,
  ): Promise<EpisodeDocument[]> {
    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    const existingEpisodes = await this.episodeModel
      .find({ seriesId: new Types.ObjectId(seriesId), seasonNumber })
      .exec();

    const existingNumbers = new Set(existingEpisodes.map(e => e.episodeNumber));

    const newEpisodes = episodes
      .filter(e => !existingNumbers.has(e.episodeNumber))
      .map(e => ({
        seriesId: new Types.ObjectId(seriesId),
        seasonNumber,
        episodeNumber: e.episodeNumber,
        videoUrl: e.videoUrl,
        thumbnailUrl: e.thumbnailUrl || '',
        uploadedBy: new Types.ObjectId(userId),
        views: 0,
      }));

    if (newEpisodes.length === 0) {
      throw new BadRequestException('All episodes already exist');
    }

    return this.episodeModel.insertMany(newEpisodes);
  }
}
